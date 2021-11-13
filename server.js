/**
 * config .env file to use environment variables
 */
require('dotenv').config()

const express = require('express')
const app = express()
app.use(express.static('public'))
app.use(express.json())


utils = require('./common')

const MongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectId
const assert = require('assert')

let db, Questions, Attempts
/**
 * Connect to mongodb using environment variables
 */
const uri = `mongodb://${process.env.MONG_ADDR}:${process.env.MONG_PORT}/wpr-quiz`
MongoClient.connect(uri, { useUnifiedTopology: true }, async (err, client) => {
    assert.strictEqual(null, err)
    db = client.db()    
    
    Questions = db.collection('questions')
    Attempts = db.collection('attempts')
 
})



app.post('/attempts', async (_req, res) => { 
    //mongodb aggregation
    const randomQues = await Questions.aggregate([
        { $sample: { size: 10 } },
        //Prevent cheating by not showing the answers from the beginning
        { $unset: ["correctAnswer"] }        
    ]).toArray()
    // console.log(randomQues)

    //insert new attempt to attempt collection
    let newAttempts = await Attempts.insertOne({
        _id: ObjectId(), 
        questions: randomQues.map(doc => doc._id),
        answers: Array.from({ length: randomQues.length }, () => undefined),
        startedAt: new Date(),
        score: 0,
        scoreText: null
    })
    newAttempts = newAttempts.ops[0]

    /**
     * set result with attempt id, questions, startAt
     */
    const result = {
        _id: newAttempts._id,
        questions: randomQues,
        startedAt: newAttempts.startedAt,
    }
    /**
     * send result if receive a post request
     */
    res.status(201).json(result)
})

app.post('/attempts/:id/submit', async (req, res) => {
    const attempt = await Attempts.findOne({ _id: ObjectId(req.params.id), scoreText: null })
    // console.log(attempt)
    /**
     * if attempt is null
     *  send Not Found
     */
    if (attempt == null) {
        return res.status(404).end()
    }     
    const qSet = await Questions.find({ _id: { $in: attempt.questions } }).toArray()
    /**
     * once get the answer from users
     *  sort to ordered answers
     */
    const orderedAnswers = utils.toOrderedAnswer(req.body.answers, attempt)
    let score = 0
    let feedBack = ""
    attempt.questions.forEach((qId, i) => {
        const ans = orderedAnswers[i] 
        if (ans == qSet.find(q => q._id == String(qId)).correctAnswer) {
            score += 1
        }
    })
    /**
     * feedBack with each score got
     */
    switch (score) {
        case score < 5 || score == null:
            feedBack = "Practice more to improve it :D"
            break
        case score < 7:
            feedBack = "Good, keep up!"
            break
        case score < 9:
            feedBack = "Well done!"
            break
        case score <= 10:
            feedBack = "Perfect!"
            break
    }
    /**
     * mongodb update attempt with updated score, scoreText and answers
     */
    await Attempts.updateOne({ _id: ObjectId(attempt._id) }, {
        $set: {
            score: score,
            scoreText: feedBack,
            answers: orderedAnswers,
        }
    }).catch(err => {
        console.error(err)
        return res.status(500).end()
    })
    /**
     * set result with attempt id, questions, correctAnswers
     *      score, scoreText, completed
     */
    const result = {
        _id: attempt._id,
        questions: qSet,
        correctAnswers:
            qSet.reduce((qaPair, q) => {
                qaPair[q._id] = q.correctAnswer
                return qaPair
            }, {}),
        answers: req.body.answers,
        score: score,
        scoreText: feedBack,
        completed: true
    }
    // console.log(result)

    res.json(result)
})




app.listen(process.env.EXPRESS_PORT, () => {
    console.log(`Listening at ${process.env.BASE_API}:${process.env.EXPRESS_PORT}`)
    app.use((req, res, next) => {
        req.Attempts = Attempts
        next()
    })
    
})