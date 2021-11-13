// TODO(you): Write the JavaScript necessary to complete the assignment.

/**
 * get Buttons
 */
const startButton = document.querySelector('#start')
const submitButton = document.querySelector('#submit')
const retryButton = document.querySelector('#retry')

let theQuiz = {}
/**
 * Function used for many selectors to be hidden at the same time
 *  Each selector will toggle the class invisible
 */
function toggleVisibility(selectors = []) {
    selectors.forEach(selector => {
        try {
            document.querySelector(selector).classList.toggle('invisible')
        } catch (error) {
            console.log(error)
        }
    })
}



/**
 * handle start button
 *  hide screen introduction, the author
 *      display screen attemp-quiz, submit field
 * scroll to top for easy looking
 */
startButton.addEventListener('click', startQuiz);
function startQuiz() {
    toggleVisibility(['.author', '#introduction', '#attempt-quiz']);
    const scrollVisibility = document.querySelector('#quiz-name');
    scrollVisibility.scrollIntoView(true);

    fetch('http://localhost:3000/attempts', {
        method: 'POST'
    }).then(response => response.json())
        .then(quiz => {
            theQuiz = quiz
            toggleVisibility(['#submit-field'])
            const container = document.querySelector('#attempt-quiz')
            quiz.questions.forEach((ques, i) => {
                let answersDiv = ""
                ques.answers.forEach((ans, i) => {
                    answersDiv += `
                        <label for="${ques._id}_${i}" class="answers">
                            <input class="ans-radio" type="radio" name="${ques._id}" id=${ques._id}_${i}>
                            <span>${ans.replaceAll('<', '&#60').replaceAll('>', '&#62').replaceAll('/', '&#47')}</span>
                            <div class="hlt"></div>
                        </label><br>
                    `
                })

                container.innerHTML += `
                    <div class="ques-container">
                        <h3 class="ques-header"><strong>Question ${i + 1} of 10</strong></h3>
                        <p>${ques.text}</p>
                        <div class="options-list margin-top">
                            ${answersDiv}
                        </div>
                    </div>
                `
            })
        })


}

/**
 * handle submit button
 *  hide screen attempt-quiz, submit field
 *      display screen review-quiz
 *      
 */
submitButton.addEventListener('click', submitQuiz);
function submitQuiz() {
    toggleVisibility(['#submit', '#review-quiz'])
    //immediately display result
    // const scrollVisibility = document.querySelector('#quiz-name');
    // scrollVisibility.scrollIntoView(true);

    let selectedAns = {}
    document.querySelectorAll('.options-list').forEach(answer => {
        answer.querySelectorAll('.ans-radio').forEach((option, i) => {
            if (option.checked) {
                selectedAns[option.getAttribute('name')] = i;
            }
        })
    })

    /**
     * 
     * I just test my object of answers
     */
    const getLengthOfObject = (obj) => {
        let lengthOfObject = Object.keys(obj).length;
        console.log(lengthOfObject);
    }
    getLengthOfObject(selectedAns);

    fetch(`http://localhost:3000/attempts/${theQuiz._id}/submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers: selectedAns })
    }).then(response => response.json())
        .then(res => {

            document.querySelector('.score').innerHTML = res.score + " / 10"
            document.querySelector('.percentage').innerHTML = res.score / res.questions.length * 100 + "%"
            document.querySelector('.feedback').innerHTML = res.scoreText

            /**
             * with each <input> of the option list
            *  we got the correct answer from correctAnswers = the const i of for loop
            */
            for (const id in res.correctAnswers) {
                document.querySelectorAll(`[name="${id}"]`).forEach((input, i) => {
                    input.setAttribute("disabled", "")
                    if (res.correctAnswers[id] == i) {
                        /**
                         * Because I got bugs on applying the css properties of "correct-choice" 
                         * to override the class hlt so I have to delete it :D
                         */
                        let hlt = input.parentElement.querySelector('.hlt')
                        input.parentElement.removeChild(hlt)
                        let adder = document.createElement('div')
                        adder.classList.add("correct-choice")
                        adder.innerHTML = "Correct Answer"
                        input.parentElement.classList.add("review-correct")
                        input.parentElement.appendChild(adder)
                    } else {
                            if (input.checked) {
                                /**
                                * Because I got bugs on applying the css properties of "wrong-choice" 
                                * to override the class hlt so I have to delete it :D
                                */
                                let hlt = input.parentElement.querySelector('.hlt')
                                input.parentElement.removeChild(hlt)
                                let adder = document.createElement('div')
                                adder.classList.add("wrong-choice")
                                adder.innerHTML = "Wrong Answer"
                                input.parentElement.classList.add("review-wrong")
                                input.parentElement.appendChild(adder)
                            }
                        }
                    
                })
            }

        })

}

/**
 * handle retry button
 *  hide screen review-quiz
 *      display author, screen introduction
 * scroll to top for easy looking
 */
retryButton.addEventListener('click', retryQuiz);
function retryQuiz() {
    const scrollVisibility = document.querySelector('#top');
    scrollVisibility.scrollIntoView(false);
    location.reload()
}






