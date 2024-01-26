import { Injectable, EventEmitter } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  roomEdit = false;

  states = [];
  redoStates = [];
  
  roomEditOperate = 'CORNER';
  roomEditStates = [];
  roomEditRedoStates = [];

  get selections(): any[] {
    return this._selections;
  }

  set selections(value: any[]) {
    this._selections = value;
    this.onSelectionsChange();
  }
  disableClone = false;
  _selections: any[] = [];
  copied: any;

  ungroupable = false;

  draggingObject = null;
  insertObject: Subject<any> = new Subject<any>();
  dragStart: Subject<any> = new Subject<any>();
  addCustomRoom: Subject<any> = new Subject<any>();
  defaultChair: Subject<any> = new Subject<any>();
  performOperation: Subject<any> = new Subject<any>();
  roomEdition: Subject<boolean> = new Subject<boolean>();
  panelSet: Subject<boolean> = new Subject<boolean>();
  saveState = new Subject<any>();

  lang = null;

  zoom = 100;
  tooltipObject = null;
  existSeats = [
    {seatId: 1, connected: false, name: 'seat 1-1', description: 'no description', category: {id: 1, name: '1st Class', color: 'blue', description: 'Normal (Online price 12.00 / Box office 14.00),Elderly (Online price 8.00 / Box office 12.00),Kids (Online price 6.00 / Box office 7.00)'}, available: true},
    {seatId: 2, connected: false, name: 'seat 1-2', description: 'no description', category: {id: 1, name: '1st Class', color: 'blue', description: 'Normal (Online price 12.00 / Box office 14.00),Elderly (Online price 8.00 / Box office 12.00),Kids (Online price 6.00 / Box office 7.00)'}, available: true},
    {seatId: 3, connected: false, name: 'seat 1-3', description: 'no description', category: {id: 1, name: '1st Class', color: 'blue', description: 'Normal (Online price 12.00 / Box office 14.00),Elderly (Online price 8.00 / Box office 12.00),Kids (Online price 6.00 / Box office 7.00)'}, available: true},
  ]
  chairCategories = [
    {id: 1, name: '1st Class', color: 'blue', description: 'Normal (Online price 12.00 / Box office 14.00),Elderly (Online price 8.00 / Box office 12.00),Kids (Online price 6.00 / Box office 7.00)'},
    {id: 2, name: '2st Class', color: 'red', description: 'Normal (Online price 12.00 / Box office 14.00),Elderly (Online price 8.00 / Box office 12.00),Kids (Online price 6.00 / Box office 7.00)'},
    {id: 3, name: 'Public Seating', color: 'yellow', description: 'Normal (Online price 12.00 / Box office 14.00),Elderly (Online price 8.00 / Box office 12.00),Kids (Online price 6.00 / Box office 7.00)'},
  ]

  public rootEventEmitter: EventEmitter<any> = new EventEmitter<any>();
  public seatEventEmitter: EventEmitter<any> = new EventEmitter<any>();
  public saveEventEmitter: EventEmitter<any> = new EventEmitter<any>();
  public seatStateEmitter: EventEmitter<any> = new EventEmitter<any>();
  constructor() {
    this.saveState.subscribe(res => {
      // console.log(res)
      if (this.roomEdit) {
        this.roomEditStates.push(res);
        this.roomEditRedoStates = [];
        return;
      }

      this.states.push(res);
      this.redoStates = [];
    });
  }

  editRoom() {
    this.roomEdit = true;
    this.roomEdition.next(true);
  }

  endEditRoom() {
    this.roomEdit = false;
    this.roomEdition.next(false);
  }

  undo() {
    if ((this.states.length === 1 && !this.roomEdit) || (this.roomEditStates.length === 1 && this.roomEdit)) {
      return;
    }
    this.performOperation.next('UNDO');
  }

  redo() {
    if ((this.redoStates.length === 0 && !this.roomEdit) || (this.roomEditRedoStates.length === 0 && this.roomEdit)) {
      return;
    }
    this.performOperation.next('REDO');
  }

  clone() {
    this.copy(true);
  }

  copy(doClone = false) {
    this.performOperation.next('COPY');
    if (doClone) {
      setTimeout(() => this.paste(), 100);
    }
  }

  paste() {
    this.performOperation.next('PASTE');
  }

  delete() {
    if (!this.selections.length) {
      return;
    }
    this.performOperation.next('DELETE');
  }

  foreground() {
    if (!this.selections.length) {
      return;
    }
    this.performOperation.next('FOREGROUND');
  }

  rotateAntiClockWise() {
    this.performOperation.next('ROTATE_ANTI');
  }

  rotateClockWise() {
    this.performOperation.next('ROTATE');
  }

  group() {
    this.performOperation.next('GROUP');
  }

  ungroup() {
    this.performOperation.next('UNGROUP');
  }

  placeInCenter(direction) {
    this.performOperation.next(direction);
  }

  arrange(side) {
    this.performOperation.next(side);
  }

  zoomIn() {
    if (this.zoom >= 150) {
      return;
    }
    this.zoom += 10;
    this.performOperation.next('ZOOM');
  }

  zoomOut() {
    if (this.zoom <= 20) {
      return;
    }
    this.zoom -= 10;
    this.performOperation.next('ZOOM');
  }

  editInfo(obj) {
    this.rootEventEmitter.emit(obj)
  }
  showTooltip(obj, pos) {
    if (this.tooltipObject?.obj !== obj) {
      this.tooltipObject = {obj, pos};
    }
  }
  hideTooltip() {
    this.tooltipObject = null;
  }
  installedSeat(seat, isDelete = false) {
    if (seat) {
      this.seatEventEmitter.emit({seat, isDelete})

    }
  }
  saveAll(panel, room) {
    this.saveEventEmitter.emit({panel, room});
  }
  onSelectionsChange() {
    this.disableClone = false;
    if (this._selections.length === 0) this.disableClone = true;
    for (let i = 0; i < this._selections.length; i++) {
      if (!this._selections[i]?.name.includes('MISCELLANEOUS')) this.disableClone = true;
    }
  }
  updateSeatState(chairs) {
    console.log(chairs)
    this.seatStateEmitter.emit(chairs);
  }
}
