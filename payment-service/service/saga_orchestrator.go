package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"payment-service/model"
	"payment-service/repo"
	"time"
)

// SagaStep represents the current step in the SAGA transaction
type SagaStep int

const (
	StepValidateCart SagaStep = iota
	StepDeductBalance
	StepCreateOrder
	StepGenerateTokens
	StepCompleteOrder
	StepClearCart
	StepCompleted
)

// SagaTransaction represents a SAGA transaction state
type SagaTransaction struct {
	UserID          string             `json:"userId"`
	Cart            model.ShoppingCart `json:"cart"`
	Order           *model.Order       `json:"order,omitempty"`
	CurrentStep     SagaStep           `json:"currentStep"`
	CompletedSteps  []SagaStep         `json:"completedSteps"`
	BalanceDeducted float64            `json:"balanceDeducted"`
	TokensGenerated []string           `json:"tokensGenerated"`
}

// CheckoutOrchestrator handles the SAGA checkout process
func CheckoutOrchestrator(userID string) (model.Order, error) {
	// Initialize SAGA transaction
	saga := &SagaTransaction{
		UserID:          userID,
		CurrentStep:     StepValidateCart,
		CompletedSteps:  []SagaStep{},
		TokensGenerated: []string{},
	}

	// Execute SAGA steps
	if err := executeCartValidation(saga); err != nil {
		return model.Order{}, err
	}

	if err := executeBalanceDeduction(saga); err != nil {
		rollback(saga)
		return model.Order{}, err
	}

	if err := executeOrderCreation(saga); err != nil {
		rollback(saga)
		return model.Order{}, err
	}

	if err := executeTokenGeneration(saga); err != nil {
		rollback(saga)
		return model.Order{}, err
	}

	if err := executeOrderCompletion(saga); err != nil {
		rollback(saga)
		return model.Order{}, err
	}

	if err := executeClearCart(saga); err != nil {
		// Don't rollback if just cart clearing fails
		fmt.Printf("Warning: Failed to clear cart for user %s: %v\n", userID, err)
	}

	saga.CurrentStep = StepCompleted
	return *saga.Order, nil
}

// Step 1: Validate cart and prepare for checkout
func executeCartValidation(saga *SagaTransaction) error {
	cart, err := ValidateCartForCheckout(saga.UserID)
	if err != nil {
		return fmt.Errorf("cart validation failed: %w", err)
	}

	saga.Cart = cart
	saga.CompletedSteps = append(saga.CompletedSteps, StepValidateCart)
	saga.CurrentStep = StepDeductBalance
	return nil
}

// Step 2: Deduct balance from stakeholders service
func executeBalanceDeduction(saga *SagaTransaction) error {
	stakeholdersURL := os.Getenv("STAKEHOLDERS_SERVICE_URL")
	if stakeholdersURL == "" {
		stakeholdersURL = "http://localhost:4000"
	}

	// Call stakeholders service to deduct balance
	reqBody := map[string]interface{}{
		"amount": -saga.Cart.Total, // Negative amount to deduct
	}

	err := callStakeholdersService(stakeholdersURL, "POST", fmt.Sprintf("/users/%s/balance/add", saga.UserID), reqBody)
	if err != nil {
		return fmt.Errorf("balance deduction failed: %w", err)
	}

	saga.BalanceDeducted = saga.Cart.Total
	saga.CompletedSteps = append(saga.CompletedSteps, StepDeductBalance)
	saga.CurrentStep = StepCreateOrder
	return nil
}

// Step 3: Create pending order
func executeOrderCreation(saga *SagaTransaction) error {
	order := model.NewOrder(saga.UserID, saga.Cart)

	createdOrder, err := repo.CreateOrder(order)
	if err != nil {
		return fmt.Errorf("order creation failed: %w", err)
	}

	saga.Order = &createdOrder
	saga.CompletedSteps = append(saga.CompletedSteps, StepCreateOrder)
	saga.CurrentStep = StepGenerateTokens
	return nil
}

// Step 4: Generate purchase tokens via tours service
func executeTokenGeneration(saga *SagaTransaction) error {
	toursURL := os.Getenv("TOURS_SERVICE_URL")
	if toursURL == "" {
		toursURL = "http://localhost:5000"
	}

	// Prepare tour IDs for token generation
	var tourIDs []string
	for _, item := range saga.Cart.Items {
		tourIDs = append(tourIDs, item.TourID)
		saga.TokensGenerated = append(saga.TokensGenerated, item.TourID)
	}

	reqBody := map[string]interface{}{
		"userId":  saga.UserID,
		"tourIds": tourIDs,
	}

	err := callToursService(toursURL, "POST", "/tokens/generate", reqBody)
	if err != nil {
		return fmt.Errorf("token generation failed: %w", err)
	}

	saga.CompletedSteps = append(saga.CompletedSteps, StepGenerateTokens)
	saga.CurrentStep = StepCompleteOrder
	return nil
}

// Step 5: Mark order as completed
func executeOrderCompletion(saga *SagaTransaction) error {
	err := repo.UpdateOrderStatus(saga.Order.ID.Hex(), model.OrderCompleted)
	if err != nil {
		return fmt.Errorf("order completion failed: %w", err)
	}

	saga.Order.MarkCompleted()
	saga.CompletedSteps = append(saga.CompletedSteps, StepCompleteOrder)
	saga.CurrentStep = StepClearCart
	return nil
}

// Step 6: Clear user's cart
func executeClearCart(saga *SagaTransaction) error {
	err := ClearUserCart(saga.UserID)
	if err != nil {
		return fmt.Errorf("cart clearing failed: %w", err)
	}

	saga.CompletedSteps = append(saga.CompletedSteps, StepClearCart)
	return nil
}

// Rollback function for failed SAGA transactions
func rollback(saga *SagaTransaction) {
	fmt.Printf("🔄 Starting SAGA rollback for user %s at step %d\n", saga.UserID, saga.CurrentStep)

	// Rollback in reverse order of completion
	for i := len(saga.CompletedSteps) - 1; i >= 0; i-- {
		step := saga.CompletedSteps[i]

		switch step {
		case StepCompleteOrder:
			rollbackOrderCompletion(saga)
		case StepGenerateTokens:
			rollbackTokenGeneration(saga)
		case StepCreateOrder:
			rollbackOrderCreation(saga)
		case StepDeductBalance:
			rollbackBalanceDeduction(saga)
		}
	}

	fmt.Printf("✅ SAGA rollback completed for user %s\n", saga.UserID)
}

func rollbackOrderCompletion(saga *SagaTransaction) {
	if saga.Order != nil {
		err := repo.UpdateOrderStatus(saga.Order.ID.Hex(), model.OrderFailed)
		if err != nil {
			fmt.Printf("❌ Failed to rollback order completion: %v\n", err)
		} else {
			fmt.Printf("✅ Rolled back order completion\n")
		}
	}
}

func rollbackTokenGeneration(saga *SagaTransaction) {
	if len(saga.TokensGenerated) > 0 {
		toursURL := os.Getenv("TOURS_SERVICE_URL")
		if toursURL == "" {
			toursURL = "http://localhost:5000"
		}

		reqBody := map[string]interface{}{
			"userId":  saga.UserID,
			"tourIds": saga.TokensGenerated,
		}

		err := callToursService(toursURL, "DELETE", "/tokens/delete", reqBody)
		if err != nil {
			fmt.Printf("❌ Failed to rollback token generation: %v\n", err)
		} else {
			fmt.Printf("✅ Rolled back token generation\n")
		}
	}
}

func rollbackOrderCreation(saga *SagaTransaction) {
	if saga.Order != nil {
		err := repo.DeleteOrder(saga.Order.ID.Hex())
		if err != nil {
			fmt.Printf("❌ Failed to rollback order creation: %v\n", err)
		} else {
			fmt.Printf("✅ Rolled back order creation\n")
		}
	}
}

func rollbackBalanceDeduction(saga *SagaTransaction) {
	if saga.BalanceDeducted > 0 {
		stakeholdersURL := os.Getenv("STAKEHOLDERS_SERVICE_URL")
		if stakeholdersURL == "" {
			stakeholdersURL = "http://localhost:4000"
		}

		reqBody := map[string]interface{}{
			"amount": saga.BalanceDeducted, // Positive amount to restore
		}

		err := callStakeholdersService(stakeholdersURL, "POST", fmt.Sprintf("/users/%s/balance/add", saga.UserID), reqBody)
		if err != nil {
			fmt.Printf("❌ Failed to rollback balance deduction: %v\n", err)
		} else {
			fmt.Printf("✅ Rolled back balance deduction\n")
		}
	}
}

// Helper function to call stakeholders service
func callStakeholdersService(baseURL, method, endpoint string, body interface{}) error {
	return callExternalService(baseURL, method, endpoint, body)
}

// Helper function to call tours service
func callToursService(baseURL, method, endpoint string, body interface{}) error {
	return callExternalService(baseURL, method, endpoint, body)
}

// Generic function to call external services
func callExternalService(baseURL, method, endpoint string, body interface{}) error {
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewBuffer(jsonData)
	}

	url := baseURL + endpoint
	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to call service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("service returned error %d: %s", resp.StatusCode, string(bodyBytes))
	}

	return nil
}
