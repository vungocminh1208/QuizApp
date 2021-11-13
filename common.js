zip = rows=>rows[0].map((_,c)=>rows.map(row=>row[c]))
// ES6

function toOrderedAnswer(submittedAnsObj, attempt) {
    const orderedQuestions = attempt.questions
    const orderedAnswers = attempt.answers
    orderedQuestions.forEach((qId, i) => {
        orderedAnswers[i] = submittedAnsObj[qId]
    }) 
    return orderedAnswers
}

module.exports = {
    zip, toOrderedAnswer
}