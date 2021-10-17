// todo: consolidate all "hidden - visible" actions to one helper function (questions + tags + headers) + tagsDictionary
class Questionnaire {
  constructor() {
    this.elements = {
      questions: [...document.querySelector(".options__wrapper").children],
      tags: [...document.querySelector(".tags").children],
      headers: [...document.querySelector(".headers").children],

      whoOptions: [...document.querySelector(".who").children],
      systemVersionOptions: [...document.querySelector(".system").children],
      durationOptions: [...document.querySelector(".duration").children],
      descriptionOptions: [...document.querySelector(".description").children],
      languageOptions: [...document.querySelector(".language").children],
      isResolvedOptions: [...document.querySelector(".is-resolved").children],
      textInput: document.querySelector(".text-input"),

      backBtn: document.querySelector(".back-btn"),
      colorChange: document.querySelector(".color-change"),
      submitBtn: null,
    };

    this.request = {
      who: "-",
      language: "-",
      systemVersion: "-",
      duration: 0,
      description: "-",
      isResolved: "-",
    };

    // this variable synchronises ALL of the visibility (current question, tags, etc)
    this.counter = 0;

    this.currentColor = 0;

    this.timeOne = 0;
    this.timeTwo = 0;
    this.timeDifference = 0;

    // not ideal at all, but whatever. ALso, names don't match with primary/secondary
    this.secondaryColorsArray = [
      "--background-color: white",
      "--fill-color: whitesmoke",
      "--primary-color: #404040",
      "--secondary-color: #888888",
      "--tags-color: #fca311",
    ];
    this.primaryColorsArray = [
      "--background-color: #121212",
      "--fill-color: #1E1E1E",
      "--primary-color: whitesmoke",
      "--secondary-color: gray",
      "--tags-color: #fca311",
    ];

    this.init();
  }

  // init runs onload & mostly sets event listeners to all of the elements (this could be *improved* by constrainig listeners on only visible elements)
  init = () => {
    // Setting the color scheme from LocalStorate
    this.setPreferredColorScheme();

    // this sets initial question (inits with the first one in the element)
    this.displayElement(this.elements.questions[this.counter]);

    // this makes Initial Header of the question visible (this is okay, because if the first field changes it is still relevant without any andjustments in index.html)
    this.elements.headers[this.counter].classList.remove("hidden");

    // choosing option for each question handler. all EVENT LISTENERS
    this.elements.whoOptions.forEach((option, idx, thisArr) => {
      option.addEventListener("click", (e) => {
        this.timeOne = Date.now();
        // this writes appropriate field to generated JSON. Hard-coded, but for this one it's fine
        this.request["who"] = e.target.innerText;
        this.tagsHandler(e);
        this.optionCountHandler(e, idx, thisArr);
      });
    });
    this.elements.languageOptions.forEach((option, idx, thisArr) => {
      option.addEventListener("click", (e) => {
        this.request["language"] = e.target.innerText;
        this.tagsHandler(e);
        this.optionCountHandler(e, idx, thisArr);
      });
    });
    this.elements.systemVersionOptions.forEach((option, idx, thisArr) => {
      option.addEventListener("click", (e) => {
        this.request["systemVersion"] = e.target.innerText;
        this.tagsHandler(e);
        this.optionCountHandler(e, idx, thisArr);
      });
    });
    this.elements.durationOptions.forEach((option, idx, thisArr) => {
      option.addEventListener("click", (e) => {
        switch (e.target.innerText) {
          case "<5":
            this.request["duration"] = 3;
            break;
          case "5-15":
            this.request["duration"] = 11;
            break;
          case "15-30":
            this.request["duration"] = 23;
            break;
          case ">30":
            this.request["duration"] = 35;
            break;
          default:
            0;
            break;
        }
        this.elements.tags[this.counter].classList.remove("hidden");
        this.elements.tags[this.counter].innerHTML = e.target.innerText;

        this.optionCountHandler(e, idx, thisArr);
      });
    });
    this.elements.descriptionOptions.forEach((option, idx, thisArr) => {
      // Making the last field in the description (which is the text input) non-clickable
      if (idx !== thisArr.length - 1) {
        option.addEventListener("click", (e) => {
          this.request["description"] = e.target.innerText;
          this.tagsHandler(e);
          this.optionCountHandler(e, idx, thisArr);
        });
      }
    });
    // this listens to ENTER on textInput, so it can be chosen as description on Enter
    this.elements.textInput.addEventListener("keydown", (e) => {
      // number 13 is the "Enter" key
      if (e.keyCode === 13 && e.target.value && e.target.value !== " ") {
        this.request["description"] = e.target.value;

        this.elements.tags[this.counter].classList.remove("hidden");
        this.elements.tags[this.counter].innerHTML = e.target.value;

        this.optionCountHandler(
          e,
          this.elements.descriptionOptions.length - 1,
          this.elements.descriptionOptions
        );
      }
    });
    this.elements.isResolvedOptions.forEach((option, idx, thisArr) => {
      option.addEventListener("click", (e) => {
        // timer stop & count
        this.timeTwo = Date.now();
        this.timeDifference = (this.timeTwo - this.timeOne) / 1000;

        this.request["isResolved"] = e.target.innerText;
        this.tagsHandler(e);
        this.optionCountHandler(e, idx, thisArr);
      });
    });
    // listening to color change btn
    this.elements.colorChange.addEventListener("click", () =>
      this.toggleColorSwitch()
    );
    // listening to back btn
    this.elements.backBtn.addEventListener("click", () =>
      this.clickBackHandler()
    );
  };

  // ALL the colors logic
  // sets (initiates) the colorScheme
  colorHandler = (colorSelector, colorValue) => {
    return document.documentElement.style.setProperty(
      colorSelector,
      colorValue
    );
  };
  setDay = () => {
    // secondary color scheme
    this.currentColor = 1;
    this.elements.colorChange.innerText = "🌙";
    this.primaryColorsArray.forEach((color) => {
      this.colorHandler(color.split(":")[0], color.split(":")[1]);
    });
  };
  setNight = () => {
    // default color scheme
    this.currentColor = 0;
    this.elements.colorChange.innerText = "🌞";
    this.secondaryColorsArray.forEach((color) => {
      this.colorHandler(color.split(":")[0], color.split(":")[1]);
    });
  };
  // onload it sets chosen before color
  setPreferredColorScheme = () => {
    const localStorageColor = parseInt(
      window.localStorage.getItem("colorScheme")
    );
    if (localStorageColor >= 0) {
      if (localStorageColor === 0) {
        this.setNight();
      } else if (localStorageColor === 1) {
        this.setDay();
      }
    }
  };
  toggleColorSwitch = () => {
    if (this.currentColor === 0) {
      this.setDay();
      window.localStorage.setItem("colorScheme", 1);
    } else if (this.currentColor === 1) {
      this.setNight();
      window.localStorage.setItem("colorScheme", 0);
    }
  };

  // helpers for element visibility (current question + headers)
  displayElement = (element) => {
    element.classList.remove("hidden");
  };
  hideElement = (element) => {
    element.classList.add("hidden");
  };
  // this is the only place where this.counter changes. Argument is iteration direction
  displayCurrentView = (direction) => {
    const adjustCounter = () => {
      return direction === "<" ? this.counter-- : this.counter++;
    };
    this.hideElement(this.elements.headers[this.counter]);
    this.hideElement(this.elements.questions[this.counter]);
    adjustCounter();
    this.displayElement(this.elements.questions[this.counter]);
    this.displayElement(this.elements.headers[this.counter]);
  };

  clickBackHandler = () => {
    // the number 2 is kind of a *hack*, because of how the this.counter works. No need to change it though
    if (this.counter < 2) {
      this.elements.backBtn.classList.add("hidden");
    }
    // repeating the "hidded" before && after displayCurrentView(). This helps with removal of the last option from .chosen-options
    this.elements.tags[this.counter].classList.add("hidden");
    this.displayCurrentView("<");
    this.elements.tags[this.counter].classList.add("hidden");
  };

  tagsHandler = (e) => {
    // this "unhides" tag above the app
    this.elements.tags[this.counter].classList.remove("hidden");
    // setting value of the tag above
    this.elements.tags[this.counter].innerHTML = e.target.innerText;
  };

  // handling the currnet option
  optionCountHandler = (e, idx, thisArr) => {
    // each option style logic (choisen or not choisen)
    thisArr.forEach((i) => {
      if (i === e.target) {
        i.classList.add("chosen");
      } else {
        i.classList.remove("chosen");
      }
    });

    if (thisArr[idx] === e.target) {
      // modal pop-up
      if (this.counter === this.elements.questions.length - 1) {
        this.modalHandler();

        // this return prevents from iterating past the last question
        return;
      }
    }

    // show and hide relevant header / question
    this.displayCurrentView(">");
    if (this.counter > 0) {
      this.elements.backBtn.classList.remove("hidden");
    }
  };

  modalHandler = () => {
    // display time of the last submit
    const time = new Date();
    let hours = time.getHours();
    let minutes = time.getMinutes();
    let seconds = time.getSeconds();

    if (hours < 10) {
      hours = `0${hours}`;
    }
    if (minutes < 10) {
      minutes = `0${minutes}`;
    }
    if (seconds < 10) {
      seconds = `0${seconds}`;
    }

    if (this.counter === this.elements.questions.length - 1) {
      const tmpTime = `${hours}:${minutes}:${seconds}`;

      // This is "decoupled" from the tags - can connect it somehow

      // keys from this objecs describe how the summary tag will be named (left side). The values should stay as they are (or the same as appropriate classNames)
      const tagsDescriptionDictionary = {
        "Option One": "option xxx",
        "Option Two": "option xxx",
        "Option Three": "option xxx",
        "Option Four": "option xxx",
        "Option Five": "option xxx",
        "Option Six": "option xxx",
      };
      let tagsDescriptionTemplate = "";

      // tags summary template constructor for the modal window
      for (let tag in tagsDescriptionDictionary) {
        tagsDescriptionTemplate += `
        <div class="final-summarize__each">
          <span class="final-description">${tag}</span>  
          <span class="final-option">
            ${this.request[tagsDescriptionDictionary[tag]]}
          </span>
        </div>
      `;
      }
      // constructor for tags description template (todo: change name)
      const tmpMessage = `
        <div class="final-summarize">
          ${tagsDescriptionTemplate}
          <div class="final-time">
            Czas wypełniania: ${this.timeDifference.toFixed(1)}s
          </div>
        </div>
      `;

      callModal(tmpTime, tmpMessage, "prześlij do bazy danych");

      // assigning submit button (it is not available before that point)
      this.elements.submitBtn = document.querySelector(".ls-modal-button");

      this.elements.submitBtn.addEventListener("click", () => {
        // POST to DB will happen here
        try {
          this.postData("/send_stats", this.request);
        } catch (error) {
          console.error(error);
        }
        // should I reset in POST??? Hmmmm
        this.reset();
      });

      // this return prevents from going beyond the last question
      return;
    }
  };

  // resetting everything after submit
  reset = () => {
    this.hideElement(this.elements.headers[this.counter]);
    this.counter = 0;
    this.displayElement(this.elements.headers[this.counter]);

    this.elements.backBtn.classList.add("hidden");
    // resetting tags
    this.elements.tags.forEach((option) => {
      option.innerHTML = "";
      option.classList.add("hidden");
    });
    this.elements.questions.forEach((question, idx) => {
      if (idx !== this.counter) {
        question.classList.add("hidden");

        // this is aggregation of all questions to clear "chosen" class when resetting
        const allQuestions = [
          this.elements.whoOptions,
          this.elements.systemVersionOptions,
          this.elements.durationOptions,
          this.elements.descriptionOptions,
          this.elements.languageOptions,
          this.elements.isResolvedOptions,
        ];
        // clearing classes of all chosen options
        allQuestions.forEach((question) => {
          question.forEach((option) => {
            option.classList.remove("chosen");
          });
        });
      } else {
        // displays the first question after reset
        question.classList.remove("hidden");
      }
    });
    this.elements.textInput.value = "";

    console.log(JSON.stringify(this.request, null, 2));
    // resetting request. Not necesarry, but we'll reset anyways
    this.request = {
      who: "-",
      language: "-",
      systemVersion: "-",
      duration: 0,
      description: "-",
      isResolved: "-",
    };
  };

  postData = async (url = "", data = {}) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.status !== 200) {
      alert(
        `\nOoops! Coś poszło nie tak.\n\nStatus: ${response.status} ${response.statusText}`
      );
    }
    return response;
  };
}

(function () {
  new Questionnaire({});
})();
