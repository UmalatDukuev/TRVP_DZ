import Load from './Load';
import AppModel from '../model/AppModel';
export default class Trip {
  #loads = [];
  #tripID = null;
  #tripFerry = '';
  #tripDest = '';
  #tripPosition = -1;
  #tripLimits = [];
  //#tripCurLoad = 0;
  //#tripCurCars = 0;

  constructor({
    tripID = null,
    ferry,
    dest,
    position,
    onDropLoadInTrip,
    addNotification
  }) {
    //console.log(typeof dest);
    //console.log(typeof this.#tripDest);
    //this.#tripCurLoad = 0;
    //this.#tripCurCars = 0;
    this.#tripFerry = String(ferry);
    this.#tripDest = String(dest);
    //console.log('constr ', dest, this.#tripDest );
    this.#tripID = tripID || crypto.randomUUID();
    this.#tripPosition = position;
    console.log('trip_position', this.#tripPosition );
    this.onDropLoadInTrip = onDropLoadInTrip;
    this.addNotification = addNotification
  }

  get tripID() { return this.#tripID; }

  get tripDest() { return this.#tripDest; }
  // get tripCurLoad() { return this.#tripCurLoad; }

  // get tripCurCars() { return this.#tripCurCars; }

  // set tripCurLoad(value) {
  //   if (typeof value === 'number' && value >= 0) {
  //     this.#tripCurLoad = value;
  //   }
  // }

  // set tripCurCars(value) {
  //   if (typeof value === 'number' && value >= 0) {
  //     this.#tripCurCars = value;
  //   }
  // }
  //добавить геттеры и сеттеры для других штук чтоб смогли потом  редактировать инфу о рейсе ??

  get tripPosition() { return this.#tripPosition; }

  get loads() { return this.#loads; }

 updateLimits =  async () => {
    this.#tripLimits = await AppModel.getLimits({
    tripID: this.#tripID
  });}

  pushLoad = ({ load }) => this.#loads.push(load);

  getLoadById = ({ loadID }) => this.#loads.find(load => load.loadID === loadID);

  deleteLoad = ({ loadID }) => {
    const deleteLoadIndex = this.#loads.findIndex(load => load.loadID === loadID);

    if (deleteLoadIndex === -1) return;

    const [deletedLoad] = this.#loads.splice(deleteLoadIndex, 1);
    
    return deletedLoad;
  };

  getCurrentLoads  = () => {
    let car_place = 0;
    let load_place = 0;

    //console.log('start');
   
    //console.log(this.#loads);
    //console.log(String(this.#loads[0]));
    for (let load of this.#loads) {
      console.log(load);
      if (type === 'cargo') {newLoad+=1;}
      if (type === 'car'){
        if (car_type === 'passenger car') {newCars +=1;}
        if (car_type === 'cargo car') {newCars +=2;}
        if (car_type === 'tractor') {newCars +=3;}
      }
    };
    console.log('car_place ', car_place, ' load_place ', load_place)
    return [car_place, load_place];
  };

  reorderLoads = async () => {
    //console.log(document.querySelector(`[id="${this.#tripID}"] .trip__loads-list`));
    const orderedLoadsIDs = Array.from(
      document.querySelector(`[id="${this.#tripID}"] .trip__loads-list`).children,
      elem => elem.getAttribute('id')
    );


    const reorderedLoadsInfo = [];

    orderedLoadsIDs.forEach((loadID, position) => {
      const load = this.#loads.find(load => load.loadID === loadID);
      if(load.loadPosition !== position){
        load.loadPosition = position;
        reorderedLoadsInfo.push({
          loadID,
          position
        });
      }
    });

    if(reorderedLoadsInfo.length > 0){
      try{
        await AppModel.updateLoads({
          reorderedLoads: reorderedLoadsInfo
        });
      } catch(err){
        this.addNotification({ text: err.message, type: 'error'});
        console.error(err);
      }

    }

    //console.log(this.#loads);
  };

  appendNewLoad = async ({ name, type, car_type }) => {
    
    //console.log(name, type, car_type)
    let tripLimits;
    try{
    //получение количества мест на пароме из бд:
      console.log(this.#tripID)
      tripLimits = await AppModel.getLimits({
        tripID: this.#tripID
      });
      tripLimits = tripLimits[0];
      console.log(tripLimits)
    } catch (err) {
      this.addNotification({ text: err.message, type: 'error'});    
      console.error(err);
    }

    const CurrentLoads = this.getCurrentLoads();
    console.log(CurrentLoads);
    let newLoad = CurrentLoads[1];
    let newCars = CurrentLoads[0];
    if (type === 'cargo') {newLoad+=1;}
    if (type === 'car'){
      if (car_type === 'passenger car') {newCars +=1;}
      if (car_type === 'cargo car') {newCars +=2;}
      if (car_type === 'tractor') {newCars +=3;}
    }
    console.log(newCars, newLoad);
    if (tripLimits['car_place'] < newCars || tripLimits['load_place'] < newLoad){
      this.addNotification({ text: 'There is not enough space on the ship', type: 'error'});
    }

    else{
      try {
      const loadID = crypto.randomUUID();
      const addLoadResult = await AppModel.addLoad({
        loadID: loadID,
        name: name,
        type: type,
        car_type: car_type,
        position: this.#loads.length,
        tripID: this.#tripID
      });

      this.addNewLoadLocal({
        loadID: loadID,
        name: name,
        type: type,
        car_type: car_type,
        position: this.#loads.length
      });

      //this.#tripCurCars = newCars;
      //this.#tripCurLoad = newLoad;
      this.updateLimits();

      this.addNotification({ text: addLoadResult.message, type: 'success'});
    } catch (err) {
      this.addNotification({ text: err.message, type: 'error'});    
      console.error(err);
    }
    }

    

    
  };


  addNewLoadLocal = ({loadID = null, name, type, car_type, position}) => {
    const newLoad = new Load({
      loadID,
      name,
      type,
      car_type,
      position,

    });
    this.#loads.push(newLoad);

    const newLoadElement = newLoad.render();
    document.querySelector(`[id="${this.#tripID}"] .trip__loads-list`)
      .appendChild(newLoadElement);
  };

  // rendering 
  render() {
    const liElement = document.createElement('li');
    liElement.classList.add(
      'trips-list__item',
      'trip'
    );
    liElement.setAttribute('id', this.#tripID);
    liElement.addEventListener(
      'dragstart',
      () => localStorage.setItem('srcTripID', this.#tripID)
    );
    liElement.addEventListener('drop', this.onDropLoadInTrip);

    const tripHeader = document.createElement('li');
    tripHeader.classList.add('trip__header');

    const h2Element_name = document.createElement('h2');
    h2Element_name.classList.add('trip__name');
    h2Element_name.innerHTML = "Trip:";
    tripHeader.appendChild(h2Element_name);

    // кнопки
    const controlsDiv = document.createElement('div');
    controlsDiv.classList.add('load__controls');

    const lowerRowDiv = document.createElement('div');
    lowerRowDiv.classList.add('load__controls-row');

    const editBtn = document.createElement('button');
    editBtn.setAttribute('type', 'button');
    editBtn.classList.add('trip__contol-btn', 'edit-icon');
    editBtn.addEventListener('click', () => {
      localStorage.setItem('editTripID', this.#tripID);
      document.getElementById('modal-edit-trip').showModal();
    });
    lowerRowDiv.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.setAttribute('type', 'button');
    deleteBtn.classList.add('trip__contol-btn', 'delete-icon');
    deleteBtn.addEventListener('click', () => {
      localStorage.setItem('deleteTripID', this.#tripID);
      const deleteTripModal = document.getElementById('modal-delete-trip');
      deleteTripModal.querySelector('.app-modal__question').innerHTML = `Trip '${this.#tripID}' and all cargos, this trip has, will be deleted. Continue?`;
      deleteTripModal.showModal();
      });

    lowerRowDiv.appendChild(deleteBtn);

    controlsDiv.appendChild(lowerRowDiv);

    tripHeader.appendChild(controlsDiv);
    liElement.appendChild(tripHeader);

    const h2Element_id = document.createElement('h2');
    h2Element_id.classList.add('trip__info');
    h2Element_id.innerHTML = "<strong>id:</strong> "+this.#tripID;
    liElement.appendChild(h2Element_id);

    const h2Element_dest = document.createElement('h2');
    h2Element_dest.classList.add('trip__info');
    //console.log("имя пункта ", this.#tripDest)
    h2Element_dest.innerHTML = "<strong>destination:</strong> " + this.#tripDest;
    liElement.appendChild(h2Element_dest);

    const h2Element_ferry = document.createElement('h2');
    h2Element_ferry.classList.add('trip__info');
    h2Element_ferry.innerHTML = "<strong>ship:</strong> " + this.#tripFerry;
    liElement.appendChild(h2Element_ferry);


    const innerUlElement = document.createElement('ul');
    innerUlElement.classList.add('trip__loads-list');
    liElement.appendChild(innerUlElement);

    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.classList.add('trip__add-load-btn');
    button.innerHTML = '&#10010; Add cargo';
    button.addEventListener('click', () => {
      localStorage.setItem('addLoadTripID', this.#tripID);
      document.getElementById('modal-add-load').showModal();
    });
    liElement.appendChild(button);
    
    //const current_loading = this.getCurrentLoads();
    //console.log(this.tripID," cur: ",current_loading)
    const h2Element_car = document.createElement('h2');
    h2Element_car.classList.add('trip__info');
    console.log("limits: ",this.#tripLimits)
    h2Element_car.innerHTML = "<strong>parking spaces:</strong> "+ this.#tripLimits[0]["car_place"];
    liElement.appendChild(h2Element_car);

    const h2Element_loading = document.createElement('h2');
    h2Element_loading.classList.add('trip__info');
    console.log("limits: ",this.#tripLimits)
    h2Element_loading.innerHTML = "<strong>cargos:</strong> "+this.#tripLimits[0]["load_place"];
    liElement.appendChild(h2Element_loading);


    const adderElement = document.querySelector('.trip-adder');
    adderElement.parentElement.insertBefore(liElement, adderElement);
  }
};
