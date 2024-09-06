from fastapi import BackgroundTasks, FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Annotated
import webscraper
import models
from database import engine, SessionLocal
from sqlalchemy.orm import Session

app = FastAPI()
models.Base.metadata.create_all(bind=engine)

class EventBase(BaseModel):
    typ: str
    titel: str
    datum: str
    beschreibung: str
    link: str

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
    except:
        print("So ein Mist mann")
    
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

def scrape_and_save_to_db():
    event_list = webscraper.scrape_events()  # Webscraping starten und Events sammeln

    # Daten in die PostgreSQL-Datenbank speichern
    db = SessionLocal()
    for event_data in event_list:
        event_type, title, date, link = event_data.split(";")

        new_event = models.Event(
            typ=event_type,
            titel=title,
            datum=date,
            beschreibung="Automatisch gescraptes Event",
            link=link
        )
        db.add(new_event)
    db.commit()
    db.close()

@app.post("/event/")
async def create_event(event: EventBase, db: db_dependency):
    db_event = models.Event(typ=event.typ, titel=event.titel, datum=event.datum, beschreibung=event.beschreibung, link=event.link)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)

@app.post("/scrape-events")
async def scrape_events(background_tasks: BackgroundTasks):
    background_tasks.add_task(scrape_and_save_to_db)
    return {"message": "Scraping started in background"}
    

    