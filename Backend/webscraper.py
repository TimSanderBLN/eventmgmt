from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

PATH = "C:\\Program Files (x86)\\chromedriver.exe"

chrome_options = Options()
chrome_options.add_argument("--disable-search-engine-choice-screen")
driver = None

def scrape_events():
    global driver
    if driver is None:
        driver = webdriver.Chrome(options=chrome_options)

    driver.get("https://www.celonis.com/de/events/search/?activeTag=0")
    print(driver.title)

    event_list = []

    # Cookies akzeptieren h
    cookiesaccept = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "onetrust-accept-btn-handler"))
    )
    cookiesaccept.click()

    cards = driver.find_element(By.CLASS_NAME, "vue-ems-results__cards")

    # Mehr anzeigen anklicken
    try:
        sm = WebDriverWait(driver, 40).until(
            EC.presence_of_element_located((By.XPATH, "//span[contains(text(), 'Mehr anzeigen')]"))
        )
        driver.execute_script('window.scrollBy(0, 2000)')
        time.sleep(5)
        showmore = driver.find_element(By.CLASS_NAME, "vue-ems-saf__show-more__button")
        showmore.click()
        driver.execute_script("window.scrollTo(0, 0);")
    except Exception as e:
        print(f"Es ist nicht anklickbar {e}")

    # Event-Daten sammeln
    time.sleep(5)
    articles = cards.find_elements(By.CLASS_NAME, "vue-ems-results__card")
    for article in articles:
        eventtype = article.find_element(By.CLASS_NAME, "ems-resource-card-2__supertitle").text
        title = article.find_element(By.CLASS_NAME, "ems-resource-card-2__title").text
        try:
            date = article.find_element(By.CLASS_NAME, "vue-ems-saf-card__date").text
        except:
            date = "no date"
        link = article.find_element(By.CSS_SELECTOR, "a").get_attribute('href')

        # Event in die Liste packen
        event_str = f"{eventtype};{title};{date};{link}"
        event_list.append(event_str)
    return event_list

def driver_quit():
    driver.quit()