from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
import time

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

    # Cookies akzeptieren
    cookiesaccept = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "onetrust-accept-btn-handler"))
    )
    cookiesaccept.click()

    # Warte, bis die Cards sichtbar sind
    cards = WebDriverWait(driver, 20).until(
        EC.visibility_of_element_located((By.CLASS_NAME, "vue-ems-results__cards"))
    )

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

    # Erstelle ActionChains, um Hover und Scroll auszuführen
    action = ActionChains(driver)

    for idx, article in enumerate(articles):
        # Scrolle zum aktuellen Artikel
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", article)
        time.sleep(2)  # Warte kurz, um sicherzustellen, dass die Seite richtig geladen wird

        # Hover über das Artikel-Element, um die Beschreibung anzuzeigen
        action.move_to_element(article).perform()
        time.sleep(2)  # Warte darauf, dass der Hover-Effekt die Beschreibung anzeigt

        eventtype = article.find_element(By.CLASS_NAME, "ems-resource-card-2__supertitle").text
        title = article.find_element(By.CLASS_NAME, "ems-resource-card-2__title").text
        try:
            date = article.find_element(By.CLASS_NAME, "vue-ems-saf-card__date").text
        except:
            date = "no date"
        link = article.find_element(By.CSS_SELECTOR, "a").get_attribute('href')

        # Beschreibung scrapen
        try:
            description = article.find_element(By.CLASS_NAME, "ems-resource-card-2__desc").text
        except:
            description = "Keine Beschreibung verfügbar"

        # Bildquelle extrahieren (erstes .png-Bild)
        try:
            image = article.find_element(By.CSS_SELECTOR, "picture source[srcset*='.png'], picture source[srcset*='.jpg'], picture source[srcset*='.jpeg'], picture source[srcset*='.webp'], picture source[srcset*='.jfif']").get_attribute("srcset")
            image_url = image.split(",")[0].split(" ")[0]  # Nur die erste URL extrahieren
        except:
            try:
                image_url = article.find_element(By.CSS_SELECTOR, "img").get_attribute("src")
            except:
                image_url = "no image"

        # Event in die Liste packen
        event_str = f"{eventtype};{title};{date};{description};{link};{image_url}"
        event_list.append(event_str)
        print(event_str)
    return event_list

def driver_quit():
    driver.quit()
