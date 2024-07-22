"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const resetButton = document.querySelector(".reset");

class Workout {
  date = new Date();
  id = Math.random().toString(36).substr(2, 9);
  type;
  clicks = 0;
  constructor(coords, distance, duration, type) {
    this.coords = [coords[0], coords[1]];
    this.distance = distance;
    this.duration = duration;
    this.type = type;
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  constructor(coords, distance, duration, candence) {
    super(coords, distance, duration, "running");
    this.candence = candence;
    this.calcPace();
  }

  calcPace() {
    this.pace = (this.duration / this.distance).toFixed(2);
    return this.pace; // min/km
  }
}

class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration, "cycling");
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }

  calcSpeed() {
    this.speed = (this.distance / this.duration).toFixed(2);
    return this.speed; //km/hour
  }
}

class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._getLocalStorage();
    this._getGeoLocation();
    form.addEventListener("submit", this._newWorkOut.bind(this));
    inputType.addEventListener("change", this._toogleElevationField);
    containerWorkouts.addEventListener("click", this._moveToMarker.bind(this));
    resetButton.addEventListener("click", this.resetLocalStorage);
  }

  _getGeoLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this));
    }
  }

  _loadMap(position) {
    const { longitude, latitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map("map").setView(coords, 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on("click", this._showForm.bind(this));
    console.log(this.#workouts);
    this.#workouts.forEach((work) => {
      this._renderPopupMarker(work);
      this._renderWorkout(work);
    });
  }

  _newWorkOut(e) {
    e.preventDefault();
    const validInputs = (...inputs) => {
      return inputs.every((inp) => Number.isFinite(inp));
    };

    const validNumbers = (...inputs) => {
      return inputs.every((inp) => inp > 0);
    };

    let workout;
    const elevation = +inputElevation.value;
    const duration = +inputDuration.value;
    const distance = +inputDistance.value;
    const cadence = +inputCadence.value;
    const type = inputType.value;

    const { lat, lng } = this.#mapEvent.latlng;

    if (type === "running") {
      if (!validInputs(duration, distance, cadence))
        return alert("Input Must be a Number");
      if (!validNumbers(duration, distance, cadence))
        return alert("Input Must be a Positive Number");

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === "cycling") {
      if (!validInputs(duration, distance, elevation))
        return alert("Input Must be a Number");
      if (!validNumbers(duration, distance, elevation))
        return alert("Input Must be a Positive Number");

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    this._renderPopupMarker(workout);
    this.#workouts.push(workout);
    this._hideForm();
    this._renderWorkout(workout);
    this._setLocalStorage();
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _toogleElevationField() {
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _renderPopupMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "cycling" ? "🚴‍♀️ Cycling" : "🏃‍♂️ Running"} on ${
          months[workout.date.getMonth()]
        } ${workout.date.getDate()}`
      )

      .openPopup();
  }
  _renderWorkout(workout) {
    const html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
          <h2 class="workout__title">${
            workout.type === "cycling" ? "Cycling" : "Running"
          } on ${months[workout.date.getMonth()]} ${workout.date.getDate()}</h2>
          <div class="workout__details">
            <span class="workout__icon">  ${
              workout.type === "cycling" ? "🚴‍♀️" : "🏃‍♂️"
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${
              workout.type === "running" ? workout.pace : workout.speed
            }</span>
            <span class="workout__unit">${
              workout.type === "running" ? "min/km" : "km/h"
            }</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === "cycling" ? "⛰" : "🦶🏼"
            }</span>
            <span class="workout__value">${
              workout.type === "cycling"
                ? workout.elevationGain
                : workout.candence
            }</span>

            <span class="workout__unit">${
              workout.type === "cycling" ? "m" : "spm"
            }</span>
          </div>
        </li>`;

    form.insertAdjacentHTML("afterend", html);
  }

  _hideForm() {
    inputElevation.value =
      inputDuration.value =
      inputDistance.value =
      inputCadence.value =
        "";
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => {
      form.style.display = "grid";
    }, 1000);
  }

  _moveToMarker(e) {
    const workEl = e.target.closest(".workout");

    if (!workEl) return;
    const workout = this.#workouts.find((mov) => workEl.dataset.id === mov.id);
    workout.click();
    this.#map.setView(workout.coords, 15, {
      animate: true,
      pan: {
        duration: 1,
        animate: true,
      },
    });
  }
  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    if (!data) return;

    data.forEach((work) => {
      if (work.type === "running") {
        const workout = new Running(
          work.coords,
          work.distance,
          work.duration,
          work.candence
        );
        this.#workouts.push(workout);
      }
      if (work.type === "cycling") {
        const workout = new Cycling(
          work.coords,
          work.distance,
          work.duration,
          work.elevationGain
        );
        this.#workouts.push(workout);
      }
    });
  }

  resetLocalStorage() {
    localStorage.clear();
    location.reload();
  }
}

const app = new App();
