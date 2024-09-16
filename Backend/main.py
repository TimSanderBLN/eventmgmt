from datetime import datetime
from fastapi import BackgroundTasks, FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Annotated, Optional
import webscraper
import models
from database import engine, SessionLocal
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS-Konfiguration hinzufügen
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # Erlaube nur diese Origin (Angular App)
    allow_credentials=True,
    allow_methods=["*"],  # Erlaube alle HTTP-Methoden
    allow_headers=["*"],  # Erlaube alle Header
)

models.Base.metadata.create_all(bind=engine)

class EventBase(BaseModel):
    typ: str
    titel: str
    datum: Optional[str]  # datum kann nun eine Zeichenkette sein, oder `None`
    beschreibung: str
    link: str
    image_url: Optional[str]  # image_url kann nun eine Zeichenkette sein, oder `None`

class BenutzerBase(BaseModel):
    vname: str
    nname: str
    email: str

class gespeichertesEventBase(BaseModel):
    zeitstempel: str


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        print(f"Fehler bei der Datenbankverbindung: {e}")
        raise e  # Ausnahme erneut werfen, damit FastAPI sie handhaben kann
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]

def event_exists_in_db(db: Session, title: str, link: str) -> bool:
    return db.query(models.Event).filter(models.Event.titel == title, models.Event.link == link).first() is not None

def scrape_and_save_to_db():
    event_list = webscraper.scrape_events()  # Webscraping starten und Events sammeln
    
    db = SessionLocal()
    for event_data in event_list:
        print(event_data)
        event_type, title, date_str, link, image_url = event_data.split(";")
        
        # Bereinigen der image_url, um alles nach ".png" zu entfernen
        if ".png" in image_url:
            image_url = image_url.split(".png")[0] + ".png"
        
        # Mapping von deutschen zu englischen Monatsnamen
        german_to_english_months = {
            "Januar": "January", "Februar": "February", "März": "March", 
            "April": "April", "Mai": "May", "Juni": "June", 
            "Juli": "July", "August": "August", "September": "September", 
            "Oktober": "October", "November": "November", "Dezember": "December"
        }
        
        # Ersetzen des deutschen Monatsnamens durch den englischen
        for german_month, english_month in german_to_english_months.items():
            if german_month in date_str:
                date_str = date_str.replace(german_month, english_month)
                break
        
        # Handle date parsing
        try:
            if "no date" in date_str.lower():
                date = None  # Handle missing dates
            else:
                # Convert date (e.g., "October 03, 2024") to YYYY-MM-DD
                date = datetime.strptime(date_str, "%B %d, %Y").date()  # Handles German month names
        except ValueError:
            date = None  # Handle invalid dates
        
         # Überprüfen, ob das Event bereits in der Datenbank vorhanden ist
        if event_exists_in_db(db, title, link):
            print(f"Event '{title}' existiert bereits in der Datenbank. Überspringen...")
            continue  # Überspringen, wenn das Event bereits existiert


        new_event = models.Event(
            typ=event_type,
            titel=title,
            datum=date,  # Save the parsed date
            beschreibung="Automatisch gescraptes Event",
            link=link,
            image_url=image_url  # image_url speichern
        )
        db.add(new_event)
    webscraper.driver_quit()
    db.commit()
    db.close()

@app.get("/events/", response_model=List[EventBase])
async def get_all_events(db: db_dependency):
    events = db.query(models.Event).all()  # Alle Events aus der Datenbank abfragen

    # Konvertiere datum in eine Zeichenkette und setze Standardwert für image_url
    result = []
    for event in events:
        result.append({
            "typ": event.typ,
            "titel": event.titel,
            "datum": event.datum.isoformat() if event.datum else None,  # `datum` als ISO-String
            "beschreibung": event.beschreibung,
            "link": event.link,
            "image_url": event.image_url if event.image_url else ""  # Standardwert für image_url
        })

    return result

@app.post("/event/")
async def create_event(event: EventBase, db: db_dependency):
    db_event = models.Event(typ=event.typ, titel=event.titel, datum=event.datum, beschreibung=event.beschreibung, link=event.link,
        image_url=event.image_url)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    webscraper.driver_quit()

@app.post("/scrape-events")
async def scrape_events(background_tasks: BackgroundTasks):
    background_tasks.add_task(scrape_and_save_to_db)
    return {"message": "Scraping started in background"}
    

    