package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"payment-service/client"
	"payment-service/model"
	"payment-service/repo"
	"time"
)

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

type SagaTransaction struct {
	UserID          string                `json:"userId"`
	Cart            model.ShoppingCart    `json:"cart"`
	Order           *model.Order          `json:"order,omitempty"`
	CurrentStep     SagaStep              `json:"currentStep"`
	CompletedSteps  []SagaStep            `json:"completedSteps"`
	BalanceDeducted float64               `json:"balanceDeducted"`
	TokensGenerated []string              `json:"tokensGenerated"`
	BalanceClient   *client.BalanceClient `json:"-"`
}

func CheckoutOrchestrator(userID string) (model.Order, error) {
	balanceClient, err := client.NewBalanceClient()
	if err != nil {
		return model.Order{}, fmt.Errorf("failed to initialize balance client: %w", err)
	}
	defer balanceClient.Close()

	saga := &SagaTransaction{
		UserID:          userID,
		CurrentStep:     StepValidateCart,
		CompletedSteps:  []SagaStep{},
		TokensGenerated: []string{},
		BalanceClient:   balanceClient,
	}

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
		fmt.Printf("Warning: Failed to clear cart for user %s: %v\n", userID, err)
	}

	saga.CurrentStep = StepCompleted
	return *saga.Order, nil
}

func executeCartValidation(saga *SagaTransaction) error {
	fmt.Printf("Usao u validaciju\n")
	cart, err := ValidateCartForCheckout(saga.UserID)
	if err != nil {
		return fmt.Errorf("cart validation failed: %w", err)
	}

	saga.Cart = cart
	saga.CompletedSteps = append(saga.CompletedSteps, StepValidateCart)
	saga.CurrentStep = StepDeductBalance
	return nil
}

func executeBalanceDeduction(saga *SagaTransaction) error {
	fmt.Printf("Skidam s racuna\n")

	newBalance, err := saga.BalanceClient.DeductBalance(saga.UserID, saga.Cart.Total)
	if err != nil {
		return fmt.Errorf("balance deduction failed: %w", err)
	}

	fmt.Printf("✅ Balance deducted successfully. New balance: %f\n", newBalance)
	saga.BalanceDeducted = saga.Cart.Total
	saga.CompletedSteps = append(saga.CompletedSteps, StepDeductBalance)
	saga.CurrentStep = StepCreateOrder
	return nil
}

func executeOrderCreation(saga *SagaTransaction) error {
	fmt.Printf("Pravim nardzbinu\n")
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

func executeTokenGeneration(saga *SagaTransaction) error {
	fmt.Printf("Generisem tokene\n")

	// return fmt.Errorf("DEBUG: TOKENI NEUSPOSNI")

	toursURL := os.Getenv("TOURS_SERVICE_URL")
	if toursURL == "" {
		toursURL = "http://tours-service:5000"
	}

	var tourIDs []string
	for _, item := range saga.Cart.Items {
		tourIDs = append(tourIDs, item.TourID)
		saga.TokensGenerated = append(saga.TokensGenerated, item.TourID)
	}

	reqBody := map[string]interface{}{
		"userId":  saga.UserID,
		"tourIds": tourIDs,
	}

	err := callInternalService(toursURL, "POST", "/internal/tokens/generate", reqBody)
	if err != nil {
		return fmt.Errorf("token generation failed: %w", err)
	}

	saga.CompletedSteps = append(saga.CompletedSteps, StepGenerateTokens)
	saga.CurrentStep = StepCompleteOrder
	return nil
}

func executeOrderCompletion(saga *SagaTransaction) error {
	fmt.Printf("Cekiram narudzbinu\n")

	err := repo.UpdateOrderStatus(saga.Order.ID.Hex(), model.OrderCompleted)
	if err != nil {
		return fmt.Errorf("order completion failed: %w", err)
	}

	saga.Order.MarkCompleted()
	saga.CompletedSteps = append(saga.CompletedSteps, StepCompleteOrder)
	saga.CurrentStep = StepClearCart
	return nil
}

func executeClearCart(saga *SagaTransaction) error {
	err := ClearUserCart(saga.UserID)
	if err != nil {
		return fmt.Errorf("cart clearing failed: %w", err)
	}

	saga.CompletedSteps = append(saga.CompletedSteps, StepClearCart)
	return nil
}

func rollback(saga *SagaTransaction) {
	fmt.Printf("🔄 Starting SAGA rollback for user %s at step %d\n", saga.UserID, saga.CurrentStep)

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
			toursURL = "http://tours-service:5000"
		}

		reqBody := map[string]interface{}{
			"userId":  saga.UserID,
			"tourIds": saga.TokensGenerated,
		}

		err := callInternalService(toursURL, "DELETE", "/internal/tokens/delete", reqBody)
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
		newBalance, err := saga.BalanceClient.AddBalance(saga.UserID, saga.BalanceDeducted)
		if err != nil {
			fmt.Printf("❌ Failed to rollback balance deduction: %v\n", err)
		} else {
			fmt.Printf("✅ Rolled back balance deduction. New balance: %f\n", newBalance)
		}
	}
}

func callInternalService(baseURL, method, endpoint string, body interface{}) error {
	return callExternalServiceWithHeaders(baseURL, method, endpoint, body, map[string]string{
		"X-Internal-Service-Key": os.Getenv("INTERNAL_SERVICE_KEY"),
	})
}

func callExternalServiceWithHeaders(baseURL, method, endpoint string, body interface{}, headers map[string]string) error {
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

	for key, value := range headers {
		req.Header.Set(key, value)
	}

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
