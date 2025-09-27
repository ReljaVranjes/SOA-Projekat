import pytest
import time
import random
import string
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.select import Select
import chromedriver_autoinstaller


"""
    E2E tests for login functionality
    SOA Project - Blog/Tours application
"""


@pytest.fixture()
def browser():
    # install chrome driver if it doesn't exist
    chromedriver_autoinstaller.install()
    
    # create chrome options for headless mode
    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    # create driver instance for test
    driver = webdriver.Chrome(options=chrome_options)
    driver.implicitly_wait(10)
    # Yield the WebDriver instance
    yield driver
    # Close the WebDriver instance
    driver.quit()


# Application URL - change according to your configuration
APPLICATION_URL = "http://localhost:3001"


class TestLoginE2E:

    
    def test_successful_login(self, browser: 'WebDriver'):
        """Test successful login with valid credentials"""
        # navigate to login page
        browser.get(f"{APPLICATION_URL}/login")
        
        # wait for page to load
        wait = WebDriverWait(browser, 10)
        
        # find input fields
        email_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email'], input[name='email']")))
        password_input = browser.find_element(By.CSS_SELECTOR, "input[type='password'], input[name='password']")
        
        # find login button
        login_button = browser.find_element(By.XPATH, "//button[contains(text(), 'Login') or contains(text(), 'Prijavi') or @type='submit']")
        
        # enter valid credentials
        email_input.clear()
        email_input.send_keys("admin@gmail.com")
        password_input.clear()
        password_input.send_keys("a")
        
        # click login button
        login_button.click()
        
        wait.until(lambda driver: "/login" not in driver.current_url)
        
        # verify login was successful (URL changed or dashboard elements present)
        current_url = browser.current_url
        assert (current_url == APPLICATION_URL + "/" or 
                "/dashboard" in current_url or 
                "/tours" in current_url or
                "/blogs" in current_url)

    def test_successful_registration(self, browser: 'WebDriver'):
        """Test successful user registration"""
        browser.get(f"{APPLICATION_URL}/register")
        
        wait = WebDriverWait(browser, 10)
        
        # find input fields
        email_input = browser.find_element(By.ID, "email")
        password_input = browser.find_element(By.ID, "password")
        role_input = browser.find_element(By.ID, "role")
        register_button = browser.find_element(By.XPATH, "//button[contains(text(), 'Create Account') or @type='submit']")
        
        select = Select(role_input)
        # enter registration credentials
        random_email = ''.join(random.choices(string.ascii_lowercase, k=8))
        random_password = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
        test_email = f"{random_email}@gmail.com"
        test_password = random_password
        
        email_input.clear()
        email_input.send_keys(test_email)
        password_input.clear()
        password_input.send_keys(test_password)
        select.select_by_value("Guide")
        
        register_button.click()
        
        # wait for redirection after successful registration
        wait.until(lambda driver: "/register" not in driver.current_url)
        
        # verify registration was successful (redirected away from register page)
        current_url = browser.current_url
        print(f"After registration, redirected to: {current_url}")
        
        assert (current_url == APPLICATION_URL + "/" or 
                "/dashboard" in current_url or 
                "/tours" in current_url or
                "/blogs" in current_url), f"Unexpected redirect to: {current_url}"

    def test_change_profile_info(self, browser: 'WebDriver'):
        """Test changing user profile information (name and first name)"""
        # First login to access profile
        browser.get(f"{APPLICATION_URL}/login")
        
        wait = WebDriverWait(browser, 10)
        
        # Login with valid credentials
        email_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email'], input[name='email']")))
        password_input = browser.find_element(By.CSS_SELECTOR, "input[type='password'], input[name='password']")
        login_button = browser.find_element(By.XPATH, "//button[contains(text(), 'Login') or contains(text(), 'Prijavi') or @type='submit']")
        
        email_input.clear()
        email_input.send_keys("admin@gmail.com")
        password_input.clear()
        password_input.send_keys("a")
        login_button.click()
        
        # Wait for successful login
        wait.until(lambda driver: "/login" not in driver.current_url)
        print(f"Logged in successfully, current URL: {browser.current_url}")
        
        # Navigate to profile page
        profile_link = wait.until(EC.element_to_be_clickable((
            By.XPATH, 
            "//a[contains(text(), 'Edit Profile')]")))
        profile_link.click()
        
        # Wait for profile page to load
        wait.until(lambda driver: "/profile" in driver.current_url or "profile" in driver.current_url.lower())
        print(f"Navigated to profile page: {browser.current_url}")
        
        # Find and click edit button or switch to edit mode
        try:
            edit_button = wait.until(EC.element_to_be_clickable((
                By.XPATH, 
                "//*[@id='root']/div/main/div/div/div[2]/div[2]/div[4]/button")))
            edit_button.click()
            print("Clicked edit profile button")
        except:
            print("No edit button found, assuming profile is already editable")

        
        # Try different selectors for name field
        first_name_input = browser.find_element(By.ID, "firstName")
    
        # Try different selectors for first name field
        last_name_input = browser.find_element(By.ID, "lastName")
        
        # Get current values for comparison
        current_first_name = first_name_input.get_attribute('value') or ""
        current_last_name = last_name_input.get_attribute('value') or ""
        print(f"Current first name: '{current_first_name}', Current last name: '{current_last_name}'")
        
        # Enter new profile information (randomized)
        random_first = ''.join(random.choices(string.ascii_uppercase + string.ascii_lowercase, k=8))
        random_last = ''.join(random.choices(string.ascii_uppercase + string.ascii_lowercase, k=8))
        new_first_name = f"Test{random_first}"
        new_last_name = f"Test{random_last}"
        
        first_name_input.clear()
        first_name_input.send_keys(new_first_name)
        last_name_input.clear()
        last_name_input.send_keys(new_last_name)
        
        print(f"Changed to - First Name: '{new_first_name}', Last Name: '{new_last_name}'")
        
        save_button = wait.until(EC.element_to_be_clickable((
            By.XPATH, 
            "//*[@id='root']/div/main/div/div/div[2]/form/div[5]/button[2]")))
        save_button.click()
        print("Clicked save button")
        
        # Wait for save operation to complete
        time.sleep(2)
        
        # Verify the changes were saved by checking the displayed values
        try:
            # Check if the first name was updated
            first_name_display = wait.until(EC.presence_of_element_located((
                By.XPATH, 
                "//*[@id='root']/div/main/div/div/div[2]/div[2]/div[1]/div[1]/p"
            )))
            displayed_first_name = first_name_display.text
            
            # Check if the last name was updated
            last_name_display = browser.find_element(By.XPATH, "//*[@id='root']/div/main/div/div/div[2]/div[2]/div[1]/div[2]/p")
            displayed_last_name = last_name_display.text
            
            print(f"Displayed First Name: '{displayed_first_name}'")
            print(f"Displayed Last Name: '{displayed_last_name}'")
            
            # Verify the changes were saved correctly
            assert displayed_first_name == new_first_name, f"First name not updated correctly. Expected: '{new_first_name}', Got: '{displayed_first_name}'"
            assert displayed_last_name == new_last_name, f"Last name not updated correctly. Expected: '{new_last_name}', Got: '{displayed_last_name}'"
            
            print("Profile update test passed - changes were saved and displayed successfully!")
            
        except Exception as e:
            print(f"Could not verify profile changes: {e}")
            # Take screenshot for debugging
            browser.save_screenshot("profile_update_verification.png")
            print("Screenshot saved for debugging")
            raise AssertionError(f"Profile update verification failed: {e}")

    def test_admin_panel_access(self, browser: 'WebDriver'):
        """Test admin panel access and logout"""
        # Login as admin
        browser.get(f"{APPLICATION_URL}/login")
        wait = WebDriverWait(browser, 10)
        
        email_input = browser.find_element(By.ID, "email")
        password_input = browser.find_element(By.ID, "password")
        login_button = browser.find_element(By.XPATH, "//button[contains(text(), 'Login') or @type='submit']")
        
        email_input.clear()
        email_input.send_keys("admin@gmail.com")
        password_input.clear()
        password_input.send_keys("a")
        login_button.click()
        
        wait.until(lambda driver: "/login" not in driver.current_url)
        
        admin_panel_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//*[@id='root']/div/main/div/div[2]/div[2]/a")))
        admin_panel_button.click()
        
        # Verify admin panel loaded
        assert "/admin" in browser.current_url


        # Block/unblock 1st user
        block_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//*[@id='root']/div/main/div/div/div[2]/div/table/tbody/tr[4]/td[5]/div/button")))
        block_button.click()

        # Logout
        logout_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//*[@id='root']/div/nav/div/div/div[2]/div/button")))
        logout_button.click()
        
        wait.until(lambda driver: "/login" in driver.current_url or driver.current_url == APPLICATION_URL + "/")
        
        # Verify logout successful
        current_url = browser.current_url
        assert "/login" in current_url or current_url == APPLICATION_URL + "/"