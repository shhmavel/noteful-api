CREATE TABLE notes(
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    folder_id INTEGER REFERENCES folders(id) NOT NULL,
    note_name VARCHAR(50),
    content VARCHAR, 
    modified_date DATE NOT NULL
);