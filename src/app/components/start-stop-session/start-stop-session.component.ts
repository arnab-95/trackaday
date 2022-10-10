import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AppComponent } from 'src/app/app.component';
import { Session } from 'src/app/models/session';
import { Break } from 'src/app/models/break';
import { TimerService } from 'src/app/services/timer.service';
import { PromptComponent } from '../prompt/prompt.component';

const timerMessages = {
  start: 'Let the countdown begin!!',
  running: 'Greatness is within sight!!',
  stop: 'Never quit keep going!!'
};

enum Status {
    STOP = 'STOP',
    PAUSE = 'PAUSE',
    RUNNING = 'RUNNING'
};

const TOTAL_SECONDS = 0;

@Component({
  selector: 'app-start-stop-session',
  templateUrl: './start-stop-session.component.html',
  styleUrls: ['./start-stop-session.component.scss']
})
export class StartStopSessionComponent implements OnInit {

  message: string = '';
  strHours: string = '';
  strMinutes: string = '';
  strSeconds: string = '';
  totalSeconds: number = TOTAL_SECONDS;
  timerId: any = null;
  status = Status.STOP;
  promptComponent: PromptComponent | undefined;
  currentTimeMinutes: number | any;
  currentTimeSeconds: number | any;

  sessionList: Session[] = [];
  session:Session | any;

  constructor(public timerService:TimerService, public appComponent: AppComponent, private dialogRef: MatDialog){ }  

  ngOnInit() {
    this.message = timerMessages.start;
    this.displayTime();
    this.timerService.waitForData().subscribe((sessionList:Session[])=>{
      this.sessionList = sessionList;
    })
  }

  countdown() {

    this.timerId = setInterval(() => {
    this.totalSeconds += 1;
    console.log(this.totalSeconds);
    this.displayTime();    }, 1000);

  }


  displayTime() {
    const seconds = this.totalSeconds % 60;
    const minutes = Math.floor((this.totalSeconds / 60) % 60);
    const hours = Math.floor(this.totalSeconds / 3600);

    this.strHours = (hours < 10) ? `0${hours}` : `${hours}`;
    this.strMinutes = (minutes < 10) ? `0${minutes}` : `${minutes}`;
    this.strSeconds = (seconds < 10) ? `0${seconds}` : `${seconds}`;

    this.pollCheckpointTimer();
  }

  startTimer() {
    if(this.status == Status.PAUSE){
      this.resumeTimer();
    } else {
      this.setStatus(Status.RUNNING);
      var timeStr = this.getTimeStr();
      const session:Session = {
        sessionId: this.sessionList.length.toString(),
        startTime: timeStr,
        endTime: timeStr,
        breakTime: [],
        taskIds: []
      }
      this.session = session;
      this.countdown();
    }
  }

  resumeTimer(){
    this.setStatus(Status.RUNNING);
    this.session.breakTime.at(-1).endTime = this.getTimeStr();
    this.countdown();
  }

  pauseTimer() {
    clearInterval(this.timerId);
    this.setStatus(Status.PAUSE);
    var timeStr = this.getTimeStr();
    const breakItem:Break = {
      startTime: timeStr,
      endTime: timeStr
    }
    this.session.breakTime.push(breakItem);
  }

  stopTimer() {
    clearInterval(this.timerId);
    this.setStatus(Status.STOP);
    this.displayTime();

    this.session.endTime = this.getTimeStr();
    this.sessionList.push(this.session);
    this.appComponent.saveSessionData(this.sessionList);
  }

  setStatus(newStatus: Status) {
    this.status = newStatus;
    switch (newStatus) {
      case Status.STOP:
        this.message = timerMessages.start;
        this.totalSeconds = TOTAL_SECONDS;
        break;
      case Status.RUNNING:
        this.message = timerMessages.running;
        break;
      case Status.PAUSE:
        this.message = timerMessages.stop;
        break;
      default:
        break;
    }
  }

  openDialog()
  { 
    this.dialogRef.closeAll()
    this.dialogRef.open(PromptComponent);
  }

  getTimeStr(){
    return (Date.now()).toString();
  }

  pollCheckpointTimer() {
    if(this.status != Status.STOP){
      if(this.totalSeconds > 15*60){
        var currTime = new Date();
        this.currentTimeSeconds = currTime.getSeconds();
        this.currentTimeMinutes = currTime.getMinutes();
        if(this.currentTimeMinutes == 0 && this.currentTimeSeconds == 0){
          this.openDialog();
        }
      }      
    }
  }
}