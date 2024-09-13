from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Date
from database import Base

class Event(Base):
    __tablename__ = 'event'

    id = Column(Integer, primary_key=True, index=True)
    typ = Column(String, index=True)
    titel = Column(String, index=True)
    datum = Column(Date, index=True)
    beschreibung = Column(String, index=True)
    link = Column(String, index=True)
    image_url = Column(String, index=True)

class Benutzer(Base):
    __tablename__ = 'benutzer'

    id = Column(Integer, primary_key=True, index=True)
    vname = Column(String, index=True)
    nname = Column(String, index=True)
    email = Column(String, index=True)

class gespeichertesEvent(Base):
     __tablename__ = 'gespeichertesEvent'
     
     id = Column(Integer, primary_key=True, index=True)
     event_id = Column(Integer, ForeignKey("event.id"))
     benutzer_id = Column(Integer, ForeignKey("benutzer.id"))
     zeitstempel = Column(Date, index=True)

