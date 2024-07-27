/****************************** */
/*******    Variables       *** */
/****************************** */
// sd

var questionCount;//number of questions
var questionIndex=0;//current question on screen is index+1
var answerchecked=null;// the checked answer
var answercheckedValue=null;// the checked answer
var answercheckedValueHTML=null;// the checked answer
var QuestionObj; //get all questions and data
var Examtime=0;
var Qtime=0;
var remainTimer,Qtimeinterval;
var submitCondition = 0;//submit case0 normal clic, 1 force click at end of time

var jump=0; // related to pick random Q value will be 1
var jumpfrom=0; // original Q
var jumpto=0; //jumped to Q


/************************************ */
/******      DOMS Declaration   ***** */
/************************************ */
var DOMnumberofQ=document.querySelector(".quiz-info .count span");
var DOMQuestionTag=document.querySelector(".question-area .question");
var DOMQuestionDrawTag=document.querySelector(".question-area .draw img");
var DOMAnswerChecked=document.querySelectorAll(".answer-area .answers input[type='radio']");
var DOMAnswerTag=document.querySelectorAll(".answer-area .answers label");
var DOMbulletspan=document.querySelector(".category .bullets .Quest-bullet .spans");
var DOMNextBtn=document.querySelector(".category .next");
var DOMDeleteBtn=document.querySelector(".category .delete");
var DOMSubmitBtn=document.querySelector(".category .submit");
var DOMWarning=document.querySelector(".category .warning");
var DOMnextArrow=document.querySelector(".category .arrow.aft");
var DOMprevArrow=document.querySelector(".category .arrow.pre");
var DOMtotalTime=document.querySelector(".exam_time");
var DOMremainTime=document.querySelector(".remain_time");
var DOMquestionTime=document.querySelector(".question_time");



/****************************** */
/*******    War Zone         ****/
/****************************** */
DOMprevArrow.disabled=true; //disable previous, starting from Q1
fn_getQuestions();// Get Questions from server

fn_refreshData((+jumpto+1)); //refresh answers and get selected


//Action in Application
// what to do when item is selected
DOMAnswerChecked.forEach(item=>{

    item.addEventListener("change",e=>{
        answerchecked=e.target.id;
        answercheckedValue=e.target.nextElementSibling.innerHTML;
        answercheckedValueHTML=e.target.getAttribute("value");
        if (questionIndex===questionCount-1) {
            fn_storeQestion(6);
            console.log(questionIndex+1);
        }
    })
})

// delete all selection and empty values from storage
DOMDeleteBtn.onclick=()=>{
    DOMAnswerChecked.forEach(item=>{
        if(item.id===answerchecked){
            item.checked=false;
            answerchecked=null;
            answercheckedValue=null;
            answercheckedValueHTML=null;
        }
        q=questionIndex+1;
        window.localStorage.setItem(`A${q}`,null)
        window.localStorage.setItem(`AValue${q}`,null)
        window.localStorage.setItem(`AinnerValue${q}`,null)
    });
};

//Add answer to storage and check answer

DOMNextBtn.addEventListener("click",()=>{
    jump=0;
    jumpfrom=questionIndex;
    jumpto=questionIndex+1;
     fn_doNext();
});

DOMnextArrow.addEventListener("click", ()=>{
    jump=0;
    jumpfrom=questionIndex;
    jumpto=questionIndex+1;
    fn_doNext();
});

DOMprevArrow.addEventListener("click", ()=>{
    jump=0;
    jumpfrom=questionIndex;
    jumpto=questionIndex-1;
    fn_doPrev();
});


DOMSubmitBtn.addEventListener("click", ()=>{
    fn_submit();
});

/****************************** */
/*******    Functions Zone   ****/
/****************************** */
//connect to server to get Q
// and set bullets as Q count
//and add Q to the screen
function fn_getQuestions(){
    let myRequest= new XMLHttpRequest();


    myRequest.onreadystatechange=function(e){
        if(this.readyState===4 && this.status===200){
            QuestionObj =JSON.parse(this.responseText);
            questionCount=QuestionObj.length;
            DOMnumberofQ.innerHTML=questionCount;

            //Create Bullet spans for questions numbers
            fn_createBullets(questionCount);

            //Add question Data into Web screen
            fn_addQuestionData(QuestionObj,questionIndex,questionCount);
            //Start Exam timing
            fn_startTotalTiming();
        }
    };
    myRequest.open("GET","Media/Files/Questions.json",true);
    myRequest.send();
};


//Create Bullet spans for questions numbers
function fn_createBullets(items){
    for (let i = 0; i < items; i++) {
        const element = document.createElement("span");
        const text = document.createTextNode(`Q${i+1}`);
        element.appendChild(text);
        DOMbulletspan.appendChild(element);
        DOMbulletspan.children[i].setAttribute("value",i);

        DOMbulletspan.children[i].addEventListener("click",function(){
            //check the origin Q and the jumbed one
            if(Math.abs(+element.getAttribute("value")-questionIndex)>1){
                jump=1;
                jumpfrom=questionIndex;
                jumpto=element.getAttribute("value");
            }else{
                jump=0;
                jumpfrom=questionIndex;
                jumpto=i;
            }
            DOMbulletspan.children[questionIndex].classList.remove("on");
            DOMSubmitBtn.style.display='none';
            DOMprevArrow.disabled=false;
            DOMnextArrow.disabled=false;
            DOMNextBtn.disabled=false;
            if(element.getAttribute("value")==="0"){
                questionIndex=i+1;
                fn_doPrev();
            }else{
                questionIndex=i-1;
                fn_doNext();
            }
        });
        if (i==0){
            element.classList.add("on");
        };
    };
};

 //Add question Data into Web screen
function fn_addQuestionData(obj,ind,qCount){
    //Adjust Q
    // ind=0;//Manuplate questions manually to test
    //Obj represents all questions
    //ind represents the question index
    DOMbulletspan.children[questionIndex].classList.add("on");
    DOMQuestionTag.querySelector("p span b").innerHTML=ind+1;
    DOMQuestionTag.querySelector(".Q").innerHTML=obj[ind].title;
    if(Object.is(obj[ind].image,null)){
        DOMQuestionDrawTag.parentElement.style.display="none";
    }else{
        DOMQuestionDrawTag.parentElement.style.display="block";
        DOMQuestionDrawTag.src=obj[ind].image;
    }

    //Adjust Answers
    for (let i = 0; i < 4; i++){
        DOMAnswerTag[i].innerHTML = obj[ind][`ans${i+1}`];
    };
    fn_qTimer(ind+1)
};


// go to the next Q
function fn_doNext(){
    if(questionIndex===0){
        DOMprevArrow.disabled=false;
    };
    DOMbulletspan.children[questionIndex].classList.remove("on");
    fn_storeQestion(jumpfrom+1);
    questionIndex++;
    fn_clearSelection();
    fn_addQuestionData(QuestionObj,questionIndex,questionCount);
    if(questionIndex+1===questionCount){
        DOMNextBtn.disabled=true;
        DOMnextArrow.disabled=true;
        DOMprevArrow.disabled=false;
        DOMSubmitBtn.style.display='block';
    }
    fn_refreshData(+jumpto+1);
}

// go to the previous Q
function fn_doPrev(){
    if(questionIndex===questionCount-1){//meaning last Q
        DOMNextBtn.disabled=false;
        DOMnextArrow.disabled=false;
        DOMSubmitBtn.style.display='none';
    }

    DOMbulletspan.children[questionIndex].classList.remove("on");
    fn_storeQestion(jumpfrom+1);
    questionIndex--;
    fn_clearSelection();
    fn_addQuestionData(QuestionObj,questionIndex,questionCount);
    if(questionIndex===0){
        DOMprevArrow.disabled=true;
    }
    fn_refreshData(+jumpto+1);
}


// Save Q in the storage till submit
function fn_storeQestion(QI){
    window.localStorage.setItem("Q"+QI,QI);
    window.localStorage.setItem("Q"+QI+"time",Qtime);
    window.localStorage.setItem("A"+QI,answerchecked);
    window.localStorage.setItem("AValue"+QI,answercheckedValue);
    window.localStorage.setItem("AinnerValue"+QI,answercheckedValueHTML);
    answerchecked=null
    answercheckedValue=null;
    answercheckedValueHTML=null;
}

//clear selection during jumping
function fn_clearSelection(){//clear 4 choices for the next Q
    DOMAnswerChecked.forEach(item=>{
        item.checked=false;
    });
}

//after jumping and get the new Q get selected if any
function fn_refreshData(q){
    //if no answer is selected return
    if(window.localStorage.getItem(`AinnerValue${q}`)=="null"||window.localStorage.getItem(`AinnerValue${q}`)==null){
        return;
    }
    //start adjust the selected item
    DOMAnswerChecked[window.localStorage.getItem(`AinnerValue${q}`)].checked=true;
    answerchecked=window.localStorage.getItem(`A${q}`);
    answercheckedValue=window.localStorage.getItem(`AValue${q}`);
    answercheckedValueHTML=window.localStorage.getItem(`AinnerValue${q}`);
}

//
function fn_startTotalTiming() {
    // window.localStorage.clear();
    var factor=3.5; //
    var totaltime=questionCount*factor*60;//in seconds
    var totMin=Math.floor(totaltime/60);//remain min
    var totSec=(totaltime*factor/60)%(factor);//remain sec
    // totMin=1;
    var remMin=parseInt(window.localStorage.getItem("timer_min"))||totMin-1
    var sremMin=remMin;
    var remSec=parseInt(window.localStorage.getItem("timer_sec"))||59;
    var sremSec=remSec;
    if(totMin<10)totMin="0"+totMin;
    if(totSec<10)totSec="0"+totSec;
    DOMtotalTime.children[1].innerHTML=totMin;
    DOMtotalTime.children[2].innerHTML=totSec;
    remainTimer=setInterval(()=>{
        if(remSec<=0){
            sremMin=--remMin;
            remSec=59;
        }
        sremSec=remSec--;
        if(remMin<10)sremMin="0"+remMin;
        if(remSec<10)sremSec="0"+remSec;
        DOMremainTime.children[1].innerHTML=sremMin;
        DOMremainTime.children[2].innerHTML=sremSec;
        window.localStorage.setItem("timer_min",sremMin)
        window.localStorage.setItem("timer_sec",sremSec)
        if(remSec<=0 && remMin==0){
            console.log("time is finished");
            clearInterval(remainTimer);
            clearInterval(Qtimeinterval);
            fn_submit(1);
        }
    },1000);
}

function fn_qTimer(qn)//qn represents question number
{
    var sQmin,sQsec;
    clearInterval(Qtimeinterval);
    Qtime=window.localStorage.getItem(`Qtime${qn}`)||0
    Qtimeinterval=setInterval(()=>{
        ++Qtime;
        window.localStorage.setItem(`Qtime${qn}`,Qtime);
        var Qmin=Math.floor(Qtime/60);sQmin=Qmin;
        var Qsec=Qtime%60;sQsec=Qsec
        if(Qmin<10)sQmin="0"+Qmin;
        if(Qsec<10)sQsec="0"+Qsec;
        DOMquestionTime.children[1].innerHTML=sQmin;
        DOMquestionTime.children[2].innerHTML=sQsec;
    },1000);

}

function fn_submit() {
    console.log(submitCondition);
    switch (submitCondition) {
        case 0:
            for (let i= 1; i <= questionCount; i++) {
                if((window.localStorage.getItem(`A${i}`)=="null"||window.localStorage.getItem(`A${i}`)==null)){
                    submitCondition=1;
                    document.querySelector(".warning").style.display="block";
                    return;}
                }
            break;
        case 1:
            console.log("send answers to server");
            break;
        default:
            break;
        }
        let score=0;

        for (let i= 1; i <= questionCount; i++) {
            if(window.localStorage.getItem(`A${i}`)==QuestionObj[i-1]["correct"]){
                    score++;
                    console.log(`Q${i} is correct`);
                }
            }
            window.localStorage.clear();
            clearInterval(remainTimer);
            clearInterval(Qtimeinterval);
            window.alert(`Your score is ${score}/${questionCount}`);
        cond=0;
        //err
            document.body.removeChild(document.getElementById("close"));

        return;
    }



