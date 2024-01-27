export default class Load {
  #loadID = '';
  #loadName = '';
  #loadType = '';
  #loadCarType = '';
  #loadPosition = -1;

  constructor({
    loadID = null,
    name,
    type,
    car_type,
    position,
  }) {
    this.#loadID = loadID || crypto.randomUUID();
    this.#loadName = name;
    this.#loadType = type;
    this.#loadCarType = car_type;
    this.#loadPosition = position;
    //console.log(loadID, name, type)
  }

  get loadID() { return this.#loadID; }

  get loadName() { return this.#loadName; }
  set loadName(value) {
    if (typeof value === 'string') {
      this.#loadName = value;
    }
  }
                                                          
  get loadPosition() { return this.#loadPosition; }
  set loadPosition(value) {
    if (typeof value === 'number' && value >= 0) {
      this.#loadPosition = value;
    }
  }
  // добавить сеттеры геттеры для остальный параметров?
  get loadType() { return this.#loadType; }
  set loadType(value) { 
    if (typeof value === 'string')  {
      this.#loadType = value;   // возможно надо будет добавить перевод в короткое обозначение (груз, авто)
    }
  }

  get loadCarType() { return this.#loadCarType; }
  set loadCarType(value) { 
    if (typeof value === 'string')  {
      this.#loadCarType = value;   // возможно надо будет добавить перевод в короткое обозначение (груз, авто)
    }
  }

  render() {
    const liElement = document.createElement('li');
    liElement.classList.add('trip__loads-list-item', 'load');
    liElement.setAttribute('id', this.#loadID);
    liElement.setAttribute('draggable', true);
    liElement.addEventListener('dragstart', (evt) => {
      evt.target.classList.add('load_selected');
      localStorage.setItem('movedLoadID', this.#loadID);
    });
    liElement.addEventListener('dragend', (evt) => evt.target.classList.remove('load_selected'));

    //const icon_par = document.createElement('p');

    const icon = document.createElement('svg');
    if (this.#loadType === 'cargo'){icon.classList.add('load-icon', 'icon');}
    else{
      if (this.#loadCarType === 'passenger car'){icon.classList.add('car-icon', 'icon');}
      if (this.#loadCarType === 'cargo car'){icon.classList.add('van-icon', 'icon');}
      if (this.#loadCarType === 'tractor'){icon.classList.add('bigtruck-icon', 'icon');}
    }
    liElement.appendChild(icon);

    const span = document.createElement('span');    //вот здесь добавлять отображение других параметров груза
    span.classList.add('load__name');
    span.innerHTML = this.#loadName;
    liElement.appendChild(span);

    const controlsDiv = document.createElement('div');
    controlsDiv.classList.add('load__controls');

    const lowerRowDiv = document.createElement('div');
    lowerRowDiv.classList.add('load__controls-row');

    const editBtn = document.createElement('button');
    editBtn.setAttribute('type', 'button');
    editBtn.classList.add('load__contol-btn', 'edit-icon');
    editBtn.addEventListener('click', () => {
      localStorage.setItem('editLoadID', this.#loadID);
      document.getElementById('modal-edit-load').showModal();
    });
    lowerRowDiv.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.setAttribute('type', 'button');
    deleteBtn.classList.add('load__contol-btn', 'delete-icon');
    deleteBtn.addEventListener('click', () => {
      localStorage.setItem('deleteLoadID', this.#loadID);

      const deleteLoadModal = document.getElementById('modal-delete-load');
      deleteLoadModal.querySelector('.app-modal__question').innerHTML = `Cargo '${this.#loadName}' will be deleted. Continue?`;

      deleteLoadModal.showModal();


      
    });
    lowerRowDiv.appendChild(deleteBtn);

    controlsDiv.appendChild(lowerRowDiv);

    liElement.appendChild(controlsDiv);

    return liElement;
  }
};
