const path = require('path')
const express = require('express')
const xss = require('xss')
const NotesService = require('./notes-service')

const notesRouter = express.Router()
const jsonParser = express.json()

const serializedNote = note => ({
    id: note.id,
    note_name: note.note_name,
    folder_id: note.folder_id,
    content: note.content,
    modified_date: note.modified_date
})

notesRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        NotesService.getAllNotes(knexInstance)
        .then(notes => {
            res.json(notes.map(serializedNote))
        })
        .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { note_name, content,folder_id, modified_date } = req.body
        const newNote = { note_name, content,folder_id, modified_date }

        for ( const [key, value] of Object.entries(newNote))
            if (value == null)
            return res.status(400).json({
                error: { message: `Missing ${key} in request body`}
            })
        NotesService.insertNote(
            req.app.get('db'),
            newNote
        )
        .then(note => {
            res
                .status(201)
                .location(path.posix.join(req.originalUrl, `/${note.id}`))
                .json(serializedNote(note))
        })
        .catch(next)    
    })
notesRouter
    .route('/:id')
    .all((req, res, next) => {
        NotesService.getById(
            req.app.get('db'),
            req.params.id
        )
        .then(note => {
            if(!note) {
                return res.status(404).json({
                    error: { message: `Note doesn't exist`}
                })
            }
            res.note = note
            next()
        })
        .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializedNote(res.note))
    })
    .delete((req, res, next) => {
        NotesService.deleteNote(
            req.app.get('db'),
            req.params.id
        )
        .then(numRowsAffected => {
            let noteId = req.params.id
            res.status(200).json({noteId})
        })
        .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const { note_name, folder_id, content, modified_date } = req.body
        const noteToUpdate = {note_name,folder_id, content, modified_date }
        const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length
        if(numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain either 'name' or 'content'`
                }
            })
        }
        NotesService.updateNote(
            req.app.get('db'),
            req.params.id,
            noteToUpdate
        )
        .then(numRowsAffected => {
            res.status(204).end()
        })
        .catch(next)
    })

    module.exports = notesRouter