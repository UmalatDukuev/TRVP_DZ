import Trip from './Trip.js';
import AppModel from '../model/AppModel.js';

export default class App {
  #trips = [];

  //getTripById = ({ tripID }) => this.#trips.find(trip => trip.tripID === tripID);

  deleteTripFromTrips = ({ tripID }) => {
    const deleteTripIndex = this.#trips.findIndex(trip => trip.tripID === tripID);

    if (deleteTripIndex === -1) return;

    const [deletedTrip] = this.#trips.splice(deleteTripIndex, 1);

    return deletedTrip;
  };


  onEscapeKeydown = (event) => {
    if (event.key === 'Escape') {
      const input = document.querySelector('.trip-adder__input');
      input.style.display = 'none';
      input.value = '';

      document.querySelector('.trip-adder__btn')
        .style.display = 'inherit';
    }
  };

  onInputKeydown = async (event) => {  //создаем новый пункт 
    if (event.key !== 'Enter') return;

    if (event.target.value) {

      const destID = crypto.randomUUID();

      try{
        const addDestResult = await AppModel.addDests({
          destID,
          name: event.target.value,
          //position: this.#trips.length
        });

        // const  newTrip = new Trip({
        //   tripID,
        //   //name: event.target.value,
        //   position: this.#trips.length,
        //   onDropLoadInTrip: this.onDropLoadInTrip,
        //   addNotification: this.addNotification
  
        // });

        // this.#trips.push(newTrip);
        // newTrip.render();

        
        this.addNotification({ text: addDestResult.message, type: 'success'});
        location.reload();

      } catch (err) {
        this.addNotification({ text: err.message, type: 'error'});
        console.error(err);

      };

      
    }

    event.target.style.display = 'none';
    event.target.value = '';

    document.querySelector('#dest-adder')
      .style.display = 'inherit';
  };

  onDropLoadInTrip = async (evt) => {
    evt.stopPropagation();

    const destTripElement = evt.currentTarget;
    destTripElement.classList.remove('trip_droppable');

    const movedLoadID = localStorage.getItem('movedLoadID');
    const srcTripID = localStorage.getItem('srcTripID');
    const destTripID = destTripElement.getAttribute('id');

    console.log("src, dest : ", srcTripID, destTripID)

    localStorage.setItem('movedLoadID', '');
    localStorage.setItem('srcTripID', '');

    if (!destTripElement.querySelector(`[id="${movedLoadID}"]`)) return;

    const srcTrip = this.#trips.find(trip => trip.tripID === srcTripID);
    const destTrip = this.#trips.find(trip => trip.tripID === destTripID);

    const load = srcTrip.loads.find(load => load.loadID === movedLoadID);
    
    try {

      console.log('destination ', srcTrip.tripDest, destTrip.tripDest)
      //проверка на одиннаковый пункт назначения
      if (srcTrip.tripDest !== destTrip.tripDest){
        this.addNotification({ text: 'Destinations don`t match', type: 'error'});
        location.reload();

        return;
      }

      let tripLimits;
      
      //получение количества мест на пароме из бд:
      //console.log(this.#tripID)
      tripLimits = await AppModel.getLimits({
        tripID: destTripID
      });
      tripLimits = tripLimits[0];
      console.log(tripLimits)

      const CurrentLoads = destTrip.getCurrentLoads();
      let newLoad = CurrentLoads[1];
      let newCars = CurrentLoads[0];

      if (load.loadType === 'cargo') {newLoad+=1;}
      if (load.loadType === 'car'){
        if (load.loadCarType === 'passenger car') {newCars +=1;}
        if (load.loadCarType === 'cargo car') {newCars +=2;}
        if (load.loadCarType === 'tractor') {newCars +=3;}
      }
      if ((tripLimits['car_place'] < newCars || tripLimits['load_place'] < newLoad) && (srcTripID !== destTripID)){
        this.addNotification({ text: 'There`s not enough space on ship', type: 'error'});
        
        location.reload();
      }

      else{
        
        if (srcTripID !== destTripID) {
          
          await AppModel.moveLoad({
            loadID: movedLoadID,
            srcTripID,
            destTripID
          });
          console.log('dest ', destTrip);
          console.log('src ', srcTrip);
          const movedLoad = srcTrip.deleteLoad({ loadID: movedLoadID });
          destTrip.pushLoad({ load: movedLoad });
    
          await srcTrip.reorderLoads();
          // console.log('hqwjqjwq');
        }
    
        await destTrip.reorderLoads();
        // console.log('hqwjqjwq');

        
        this.addNotification({ text: `Load (ID: ${movedLoadID}) move between trips`, type: 'success'});
      }
    } catch(err) {
      this.addNotification({ text: err.message, type: 'error'});
      console.error(err);

    }
    // const destLoadsIDs = Array.from(
    //   destTripElement.querySelector('.Trip__loads-list').children,
    //   elem => elem.getAttribute('id')
    // );

    // destLoadsIDs.forEach((loadID, position) => {
    //   destTrip.getLoadById({ loadID }).loadPosition = position;
    // });

    // console.log(this.#Trips);
  };


  // удаление рейса
  deleteTrip = async ({ tripID }) => {

    //удаляем
    try{
      let delLoad = null;
      //удалим все задачи?
      //console.log("tripID  ", tripID);
      //console.log(this.#trips);
      let curTrip = this.#trips.find(trip => trip.tripID === tripID);
      //console.log("cur_trip ", curTrip);
      for (let load of curTrip.loads) {
        const loadID = load.loadID;
        delLoad = await AppModel.deleteLoad({ loadID });
        curTrip.deleteLoad({ loadID });
        document.getElementById(loadID).remove();
      }


      const deleteTripResult = await AppModel.deleteTrip({ tripID });
      this.deleteTripFromTrips(tripID);
      document.getElementById(tripID).remove();

      this.addNotification({ text: deleteTripResult.message, type: 'success'});
    } catch (err) {
      this.addNotification({ text: err.message, type: 'error'});
      console.error(err);
    }

    
  };
 
  
  editTrip = async ({ tripID, newDestID, newFerryID}) => {
    // let fLoad = null;
    // for (let trip of this.#trips) {
    //   fLoad = trip.getLoadById({ loadID });
    //   if (fLoad) break;
    // }

    //const curLoadName = fLoad.loadName;
    //if (!newLoadName || newLoadName === curLoadName) return;

    try{
      const updateTripResult = await AppModel.updateTrip({ tripID, destID: newDestID, ferryID : newFerryID});

      //fLoad.loadText = newLoadName;
      //document.querySelector(`[id="${loadID}"] span.load__name`).innerHTML = newLoadName;
      location.reload(); //надо изменить потом чтоб нормально было 

      //console.log(updateTripResult);
      this.addNotification({ text: updateTripResult.message, type: 'success'});
    } catch (err) {
      this.addNotification({ text: err.message, type: 'error'});
      console.error(err);

    }

    
  };

  editLoad = async ({ loadID, newLoadName, newLoadType, newLoadCarType }) => {
    let fLoad = null;
    for (let trip of this.#trips) {
      fLoad = trip.getLoadById({ loadID });
      if (fLoad) break;
    }

    //const curLoadName = fLoad.loadName;
    //if (!newLoadName || newLoadName === curLoadName) return;

    try{
      const updateLoadResult = await AppModel.updateLoad({ loadID, name: newLoadName, type : newLoadType, car_type: newLoadCarType});

      fLoad.loadText = newLoadName;
      document.querySelector(`[id="${loadID}"] span.load__name`).innerHTML = newLoadName;

      //console.log(updateLoadResult);
      this.addNotification({ text: updateLoadResult.message, type: 'success'});
    } catch (err) {
      this.addNotification({ text: err.message, type: 'error'});
      console.error(err);

    }

    
  };

  


  deleteLoad = async ({ loadID }) => {
    let fLoad = null;
    let fTrip = null;
    //ищем в каком рейсе
    for (let trip of this.#trips) {
      fTrip = trip;
      fLoad = trip.getLoadById({ loadID });
      if (fLoad) break;
    }

    //удаляем
    try{
      const deleteLoadResult = await AppModel.deleteLoad({ loadID });

      fTrip.deleteLoad({ loadID });
      await fTrip.updateLimits();
      document.getElementById(loadID).remove();

      this.addNotification({ text: deleteLoadResult.message, type: 'success'});
    } catch (err) {
      this.addNotification({ text: err.message, type: 'error'});
      console.error(err);
    }

    
  };

  //новый модал для редактирования рейса
  async initEditTripModal() {
    const EditTripModal = document.getElementById('modal-edit-trip');
    //список пунктов назначений
    const dests = await AppModel.getDests();
    const label_element = document.getElementById('label-for-select-dest_ed');
    //console.log(dests);

    const selectElement = document.createElement('select');
    const id_select = crypto.randomUUID();
    localStorage.setItem('select_dest_edit_id', id_select);
    selectElement.setAttribute('id', id_select);
    selectElement.setAttribute('class', 'app-modal__input');
    for(let dest of dests){
      const optionElement = document.createElement('option');
      optionElement.innerHTML = dest['name'];
      optionElement.setAttribute('id', dest['destID']);
      
      optionElement.setAttribute('value', dest['name']);
      selectElement.appendChild(optionElement);

    }
    label_element.after(selectElement);
    
    // список паромов
    const ferrys = await AppModel.getFerrys();
    const label_element_f = document.getElementById('label-for-select-ferry_ed');
    //console.log("ferrys ",ferrys);

    const selectElementF = document.createElement('select');
    const id_select_f = crypto.randomUUID();
    localStorage.setItem('select_ferry_edit_id', id_select_f);
    selectElementF.setAttribute('id', id_select_f);
    selectElementF.setAttribute('class', 'app-modal__input');
    for(let ferry of ferrys){
      const optionElementF = document.createElement('option');
      optionElementF.innerHTML = ferry['name'];
      optionElementF.setAttribute('id', ferry['ferryID']);
      optionElementF.setAttribute('value', ferry['name']);

      selectElementF.appendChild(optionElementF);

    }
    label_element_f.after(selectElementF);



    const cancelHandler = () => {
      EditTripModal.close();
      localStorage.setItem('editTripID', '');
      //createTripModal.querySelector('.app-modal__input').value = ''; //возможно надо будет чтото другое обнулить
    };

    const okHandler = async () =>  {
      const tripID = localStorage.getItem('editTripID');
      const id_select_dest = localStorage.getItem('select_dest_edit_id');
      const modalInputDest = document.getElementById(id_select_dest);
      
      const id_select_ferry = localStorage.getItem('select_ferry_edit_id');
      const modalInputFerry = document.getElementById(id_select_ferry);
      //const modalInputCarType = addLoadModal.querySelector('#modal-select-load-car-type');

      const destID = String(modalInputDest.options[modalInputDest.selectedIndex].id);
      const destName = String(modalInputDest.options[modalInputDest.selectedIndex].value);
      //console.log("destID ", destID);

      const ferryID = String(modalInputFerry.options[modalInputFerry.selectedIndex].id);
      const ferryName = String(modalInputFerry.options[modalInputFerry.selectedIndex].value);
      //console.log("ferryID ", ferryID);


      try{
        const editTripResult = this.editTrip({tripID, newDestID: destID, newFerryID: ferryID});

        
        this.addNotification({ text: editTripResult.message, type: 'success'});

      } catch (err) {
        this.addNotification({ text: err.message, type: 'error'});
        console.error(err);

      }

      

      cancelHandler();
      }
      EditTripModal.querySelector('.modal-ok-btn').addEventListener('click', okHandler);
      EditTripModal.querySelector('.modal-cancel-btn').addEventListener('click', cancelHandler);
      EditTripModal.addEventListener('close', cancelHandler);
    };

    

  //новый модал для создания рейса
  async initCreateTripModal() {
    const createTripModal = document.getElementById('modal-create-trip');
    //список пунктов назначений
    const dests = await AppModel.getDests();
    const label_element = document.getElementById('label-for-select-dest');
    //console.log(dests);

    const selectElement = document.createElement('select');
    const id_select = crypto.randomUUID();
    localStorage.setItem('select_dest_id', id_select);
    selectElement.setAttribute('id', id_select);
    selectElement.setAttribute('class', 'app-modal__input');
    for(let dest of dests){
      const optionElement = document.createElement('option');
      optionElement.innerHTML = dest['name'];
      optionElement.setAttribute('id', dest['destID']);
      
      optionElement.setAttribute('value', dest['name']);
      selectElement.appendChild(optionElement);

    }
    label_element.after(selectElement);
    
    // список паромов
    const ferrys = await AppModel.getFerrys();
    const label_element_f = document.getElementById('label-for-select-ferry');
    //console.log("ferrys ",ferrys);

    const selectElementF = document.createElement('select');
    const id_select_f = crypto.randomUUID();
    localStorage.setItem('select_ferry_id', id_select_f);
    selectElementF.setAttribute('id', id_select_f);
    selectElementF.setAttribute('class', 'app-modal__input');
    for(let ferry of ferrys){
      const optionElementF = document.createElement('option');
      optionElementF.innerHTML = ferry['name'];
      optionElementF.setAttribute('id', ferry['ferryID']);
      optionElementF.setAttribute('value', ferry['name']);

      selectElementF.appendChild(optionElementF);

    }
    label_element_f.after(selectElementF);



    const cancelHandler = () => {
      createTripModal.close();
      //localStorage.setItem('addLoadTripID', '');
      //createTripModal.querySelector('.app-modal__input').value = ''; //возможно надо будет чтото другое обнулить
    };

    const okHandler = async () =>  {
      //const tripID = localStorage.getItem('addLoadTripID');
      const id_select_dest = localStorage.getItem('select_dest_id');
      const modalInputDest = document.getElementById(id_select_dest);
      
      const id_select_ferry = localStorage.getItem('select_ferry_id');
      const modalInputFerry = document.getElementById(id_select_ferry);
      //const modalInputCarType = addLoadModal.querySelector('#modal-select-load-car-type');

      const destID = String(modalInputDest.options[modalInputDest.selectedIndex].id);
      const destName = String(modalInputDest.options[modalInputDest.selectedIndex].value);
      //console.log("destID ", destID);

      const ferryID = String(modalInputFerry.options[modalInputFerry.selectedIndex].id);
      const ferryName = String(modalInputFerry.options[modalInputFerry.selectedIndex].value);
      //console.log("ferryID ", ferryID);

      if(destID && ferryID){
        const tripID = crypto.randomUUID();

      try{
        const addTripResult = await AppModel.addTrips({
          tripID,
          destID,
          ferryID,
          position: this.#trips.length
        });

        const  newTrip = new Trip({
          tripID: tripID,
          ferry: ferryName,
          dest: destName,
          //name: event.target.value,
          position: this.#trips.length,
          onDropLoadInTrip: this.onDropLoadInTrip,
          addNotification: this.addNotification
  
        });
        await newTrip.updateLimits();

        this.#trips.push(newTrip);
        newTrip.render();

        
        this.addNotification({ text: addTripResult.message, type: 'success'});

      } catch (err) {
        this.addNotification({ text: err.message, type: 'error'});
        console.error(err);

      };

      }

      cancelHandler();
    };

    createTripModal.querySelector('.modal-ok-btn').addEventListener('click', okHandler);
    createTripModal.querySelector('.modal-cancel-btn').addEventListener('click', cancelHandler);
    createTripModal.addEventListener('close', cancelHandler);
  }


  initAddLoadModal() {
    const addLoadModal = document.getElementById('modal-add-load');
    const cancelHandler = () => {
      addLoadModal.close();
      localStorage.setItem('addLoadTripID', '');
      addLoadModal.querySelector('.app-modal__input').value = '';
    };

    const okHandler = () => {
      const tripID = localStorage.getItem('addLoadTripID');
      const modalInputName = addLoadModal.querySelector('#modal-add-load-input-name');
      const modalInputType = addLoadModal.querySelector('#modal-select-load-type');
      const modalInputCarType = addLoadModal.querySelector('#modal-select-load-car-type');

      let car_type = "cargo";
      if (modalInputType.options[modalInputType.selectedIndex].text == 'car'){
        car_type = modalInputCarType.options[modalInputCarType.selectedIndex].text;
      }

      if(tripID && modalInputName.value && modalInputType.value){
        this.#trips.find(trip => trip.tripID === tripID).appendNewLoad({ name: modalInputName.value,
                                                                         type: modalInputType.options[modalInputType.selectedIndex].text,
                                                                         car_type: car_type});

      }

      cancelHandler();
    };

    addLoadModal.querySelector('.modal-ok-btn').addEventListener('click', okHandler);
    addLoadModal.querySelector('.modal-cancel-btn').addEventListener('click', cancelHandler);
    addLoadModal.addEventListener('close', cancelHandler);
  }

  initEditLoadModal() {
    const editLoadModal = document.getElementById('modal-edit-load');
    const cancelHandler = () => {
      editLoadModal.close();
      localStorage.setItem('editLoadID', '');
      editLoadModal.querySelector('.app-modal__input').value = '';
    };

    const okHandler = () => {
      const loadID = localStorage.getItem('editLoadID');
      // const modalInput = editLoadModal.querySelector('.app-modal__input');
      const modalInputName = editLoadModal.querySelector('#modal-add-load-input-name-new');
      const modalInputType = editLoadModal.querySelector('#modal-select-load-type-new');
      const modalInputCarType = editLoadModal.querySelector('#modal-select-load-car-type-new');
      
      let car_type = "cargo";
      if (modalInputType.options[modalInputType.selectedIndex].text == 'car'){
        car_type = modalInputCarType.options[modalInputCarType.selectedIndex].text;
      }

      if(loadID && modalInputName.value && modalInputType.value){
        this.editLoad({loadID, newLoadName: modalInputName.value,
        newLoadType: modalInputType.options[modalInputType.selectedIndex].text,
        newLoadCarType: car_type});

      }

      cancelHandler();
    };

    editLoadModal.querySelector('.modal-ok-btn').addEventListener('click', okHandler);
    editLoadModal.querySelector('.modal-cancel-btn').addEventListener('click', cancelHandler);
    editLoadModal.addEventListener('close', cancelHandler);
  }

  initDeleteLoadModal() {
    const deleteLoadModal = document.getElementById('modal-delete-load');
    const cancelHandler = () => {
      deleteLoadModal.close();
      localStorage.setItem('deleteLoadID', '');
    };

    const okHandler = () => {
      const loadID = localStorage.getItem('deleteLoadID');

      if(loadID){
        this.deleteLoad({loadID});

      }

      cancelHandler();
    };

    deleteLoadModal.querySelector('.modal-ok-btn').addEventListener('click', okHandler);
    deleteLoadModal.querySelector('.modal-cancel-btn').addEventListener('click', cancelHandler);
    deleteLoadModal.addEventListener('close', cancelHandler);
  }


  initNotifications() {
    const notifications = document.getElementById('app-notifications');
    notifications.show();
  }


  addNotification = ({text, type}) => {
    const notifications = document.getElementById('app-notifications');

    const notificationID = crypto.randomUUID();
    const notification = document.createElement('div');
    notification.classList.add(
      'notification',
      type === 'success' ? 'notification-success': 'notification-error'
    );

    notification.setAttribute('id', notificationID);
    notification.innerHTML = text;

    notifications.appendChild(notification);

    setTimeout(() => {document.getElementById(notificationID).remove();}, 5000)
  };


  initDeleteTripModal() {
    const deleteTripModal = document.getElementById('modal-delete-trip');
    const cancelHandler = () => {
      deleteTripModal.close();
      localStorage.setItem('deleteTripID', '');
    };

    const okHandler = () => {
      console.log("1111")
      const tripID = localStorage.getItem('deleteTripID');

      if(tripID){
        this.deleteTrip({tripID});

      }

      cancelHandler();
    };

    deleteTripModal.querySelector('.modal-ok-btn').addEventListener('click', okHandler);
    deleteTripModal.querySelector('.modal-cancel-btn').addEventListener('click', cancelHandler);
    deleteTripModal.addEventListener('close', cancelHandler);
  }


  initNotifications() {
    const notifications = document.getElementById('app-notifications');
    notifications.show();
  }


  addNotification = ({text, type}) => {
    const notifications = document.getElementById('app-notifications');

    const notificationID = crypto.randomUUID();
    const notification = document.createElement('div');
    notification.classList.add(
      'notification',
      type === 'success' ? 'notification-success': 'notification-error'
    );

    notification.setAttribute('id', notificationID);
    notification.innerHTML = text;

    notifications.appendChild(notification);

    setTimeout(() => {document.getElementById(notificationID).remove();}, 5000)
  };

  async init() {
    document.querySelector('#dest-adder')
      .addEventListener(
        'click',
        (event) => {
          event.target.style.display = 'none';

          const input = document.querySelector('#dest-adder-input');
          input.style.display = 'inherit';
          input.focus();
        }
      );

    document.querySelector('.trip-adder__btn')
    .addEventListener('click', () => {
      //localStorage.setItem('addLoadTripID', this.#tripID);
      document.getElementById('modal-create-trip').showModal();
    });

    document.addEventListener('keydown', this.onEscapeKeydown);

    document.querySelector('#dest-adder-input')
      .addEventListener('keydown', this.onInputKeydown);

    document.getElementById('theme-switch')
      .addEventListener('change', (evt) => {
        (evt.target.checked
          ? document.body.classList.add('dark-theme')
          : document.body.classList.remove('dark-theme'));
      });
    
    this.initCreateTripModal();  
    this.initEditTripModal();
    this.initAddLoadModal();
    this.initEditLoadModal(); 
    this.initDeleteLoadModal();
    this.initDeleteTripModal();
    this.initNotifications();


    document.addEventListener('dragover', (evt) => {
      evt.preventDefault();

      const draggedElement = document.querySelector('.load.load_selected');
      const draggedElementPrevList = draggedElement.closest('.trip');

      const currentElement = evt.target;
      const prevDroppable = document.querySelector('.trip_droppable');
      let curDroppable = evt.target;
      while (!curDroppable.matches('.trip') && curDroppable !== document.body) {
        curDroppable = curDroppable.parentElement;
      }

      if (curDroppable !== prevDroppable) {
        if (prevDroppable) prevDroppable.classList.remove('trip_droppable');

        if (curDroppable.matches('.trip')) {
          curDroppable.classList.add('trip_droppable');
        }
      }

      if (!curDroppable.matches('.trip') || draggedElement === currentElement) return;

      if (curDroppable === draggedElementPrevList) {
        if (!currentElement.matches('.load')) return;

        const nextElement = (currentElement === draggedElement.nextElementSibling)
          ? currentElement.nextElementSibling
          : currentElement;

        curDroppable.querySelector('.trip__loads-list')
          .insertBefore(draggedElement, nextElement);

        return;
      }

      if (currentElement.matches('.load')) {
        curDroppable.querySelector('.trip__loads-list')
          .insertBefore(draggedElement, currentElement);

        return;
      }

      if (!curDroppable.querySelector('.trip__loads-list').children.length) {
        curDroppable.querySelector('.trip__loads-list')
          .appendChild(draggedElement);
      }
    });

    try{
      const trips = await AppModel.getTrips();
      
      for(const trip of trips){
        const tripObj = new Trip({
          tripID: trip.tripID,
          ferry: trip.ferryName,
          dest: trip.destName,
          position: trip.position,
          onDropLoadInTrip: this.onDropLoadInTrip,
          addNotification: this.addNotification
          // onEditLoad: this.onEditLoad,
        });

        await tripObj.updateLimits();

        this.#trips.push(tripObj);
        tripObj.render();
        console.log('loads in trip',trip.loads)
        for( const load of trip.loads){
          tripObj.addNewLoadLocal({
            loadID: load.loadID,
            name: load.name,
            type: load.type,
            car_type: load.car_type,
            position: load.position
          });
        
        }
      }

    } catch( err) {
      this.addNotification({ text: err.message, type: 'error'});
      console.error(err);
    }
  }
};
