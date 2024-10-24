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
    allow_origins=[
        "http://localhost:4200", 
        "http://localhost:8000", 
        "http://127.0.0.1:8000",
        "http://127.0.0.1:4200"
    ], 
    allow_credentials=True,
    allow_methods=["*"],  # Erlaube alle HTTP-Methoden (GET, POST usw.)
    allow_headers=["*"],  # Erlaube alle Header
)

models.Base.metadata.create_all(bind=engine)

class EventBase(BaseModel):
    id: int
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

class GespeichertesEventResponse(BaseModel):
    saved_event_id: int  # ID des gespeicherten Events
    id: int  # Event-ID
    typ: str
    titel: str
    datum: Optional[str]  # datum kann nun eine Zeichenkette sein, oder `None`
    beschreibung: str
    link: str
    image_url: Optional[str]  # image_url kann eine Zeichenkette sein oder `None`


class EventSaveRequest(BaseModel):
    event_id: int
    email: str


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
        event_type, title, date_str, description, link, image_url = event_data.split(";")
        
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
                date = datetime.strptime(date_str, "%B %d, %Y").date()
        except ValueError:
            date = None  # Handle invalid dates

        if event_exists_in_db(db, title, link):
            print(f"Event '{title}' existiert bereits in der Datenbank. Überspringen...")
            continue  # Überspringen, wenn das Event bereits existiert

        new_event = models.Event(
            typ=event_type,
            titel=title,
            datum=date,  # Save the parsed date
            beschreibung=description,  # Save the scraped description
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
            "id": event.id,  # Füge die ID hinzu
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

# API-Endpunkt, um ein Event in "gespeichertesEvent" zu speichern
@app.post("/save-event/")
async def save_event(request_data: EventSaveRequest, db: Session = Depends(get_db)):
    print(request_data)
    # Benutzer anhand der E-Mail aus der Datenbank suchen
    benutzer = db.query(models.Benutzer).filter(models.Benutzer.email == request_data.email).first()
    
    if benutzer is None:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")

    # Neues gespeichertes Event erstellen
    gespeichertes_event = models.gespeichertesEvent(
        event_id=request_data.event_id,
        benutzer_id=benutzer.id,
        zeitstempel=datetime.now(),
        
    )
    # In der Datenbank speichern
    db.add(gespeichertes_event)
    db.commit()
    
    return {"message": "Event erfolgreich gespeichert"}
    

@app.get("/get-user/")
async def get_user(email: str, db: Session = Depends(get_db)):
    benutzer = db.query(models.Benutzer).filter(models.Benutzer.email == email).first()
    
    if benutzer is None:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")

    return {
        "id": benutzer.id,
        "vname": benutzer.vname,
        "nname": benutzer.nname,
        "email": benutzer.email
    }

@app.get("/gespeicherte-events/", response_model=List[GespeichertesEventResponse])
async def get_saved_events(email: str, db: db_dependency):
    # Benutzer anhand der E-Mail suchen
    benutzer = db.query(models.Benutzer).filter(models.Benutzer.email == email).first()

    if not benutzer:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")

    # Gespeicherte Events des Benutzers abfragen
    gespeicherte_events = db.query(models.gespeichertesEvent).filter_by(benutzer_id=benutzer.id).all()

    # Die zugehörigen Event-Daten laden und die ID des gespeicherten Events zurückgeben
    events = []
    for gespeichertes_event in gespeicherte_events:
        event = db.query(models.Event).filter_by(id=gespeichertes_event.event_id).first()
        if event:
            events.append({
                "saved_event_id": gespeichertes_event.id,  # Die ID des gespeicherten Events
                "id": event.id,  # Die ID des eigentlichen Events
                "typ": event.typ,
                "titel": event.titel,
                "datum": event.datum.isoformat() if event.datum else None,
                "beschreibung": event.beschreibung,
                "link": event.link,
                "image_url": event.image_url
            })

    return events



@app.delete("/delete-event/{saved_event_id}/")
async def delete_event(saved_event_id: int, db: Session = Depends(get_db)):
    # Suche das gespeicherte Event anhand der ID des gespeicherten Events
    gespeichertes_event = db.query(models.gespeichertesEvent).filter(models.gespeichertesEvent.id == saved_event_id).first()

    if gespeichertes_event:
        # Lösche das gefundene gespeicherte Event
        db.delete(gespeichertes_event)
        db.commit()
        return {"success": True, "message": "Gespeichertes Event erfolgreich gelöscht"}
    else:
        raise HTTPException(status_code=404, detail="Gespeichertes Event nicht gefunden")

@app.post("/create-user/")
async def create_user(benutzer: BenutzerBase, db: db_dependency):
    # Prüfen, ob Benutzer mit der E-Mail bereits existiert
    existing_user = db.query(models.Benutzer).filter(models.Benutzer.email == benutzer.email).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Benutzer mit dieser E-Mail existiert bereits")
    
    # Neuen Benutzer anlegen
    new_user = models.Benutzer(vname=benutzer.vname, nname=benutzer.nname, email=benutzer.email)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)  # Aktualisieren, um auf das neue Benutzerobjekt zugreifen zu können
    
    return {
        "message": "Benutzer erfolgreich erstellt",
        "id": new_user.id,
        "vname": new_user.vname,
        "nname": new_user.nname,
        "email": new_user.email
    }
