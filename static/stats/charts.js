// tmp
const response = await fetch("/get_all_records");
let testData = await response.json();

class ChartPage {
  constructor() {
    // dom elements for chart
    this.elements = {
      chartCtx: document.getElementById("chart").getContext("2d"),

      chartDataLanguage: document.getElementById("chartData__language"),
      chartDataSystem: document.getElementById("chartData__system"),
      chartDataDuration: document.getElementById("chartData__duration"),
      chartDataCallsNumber: document.getElementById("chartData__calls-number"),
      chartDataWho: document.getElementById("chartData__who"),

      rangeDateOne: document.getElementById("range-date-one"),
      rangeDateTwo: document.getElementById("range-date-two"),

      resetRange: document.querySelector(".reset-range"),
    };

    // chart settings
    this.chartSettings = {
      chartHeaderSize: 36,
      showLegend: false,

      titlePosition: "top",
      displayTitle: true,

      chartLabelsSize: 18,
      columnsLabelColor: "gray", // top value color
      alignPosition: "top", // around the chart's border
      anchorPosition: "end", // top / bottom etc of the chart
      chartColorPalette: [
        "silver",
        // "#757575",
        // "#616161",
        // "#5D4037",
        // "#689F38",
        // "#2E7D32",
        // "#00695C",
        // "#006064",
      ],
    };

    // range options for chart
    this.ranges = {
      from: null,
      to: null,
    };

    // needed to declare some stuff
    this.chart = null;
    this.chartType = null;
    this.maxValue = null;
    this.suggestedMax = null;

    // putting all options into the Array for a bit cleaner listeners
    this.allOptions = [
      this.elements.chartDataLanguage,
      this.elements.chartDataSystem,
      this.elements.chartDataDuration,
      this.elements.chartDataCallsNumber,
      this.elements.chartDataWho,
    ];
    this.rangeDates = [this.elements.rangeDateOne, this.elements.rangeDateTwo];

    this.chartData = {
      // LANGUAGE labels && data
      languageTable: {},
      languageLabels: [],
      languageData: [],
      // SYSTEM labels && data
      systemTable: {},
      systemLabels: [],
      systemData: [],
      // DURATION labels && data
      durationTable: {},
      durationLabels: [],
      durationData: [],
      // DATES labels && data
      datesTable: {},
      datesLabels: [],
      datesData: [],
      // WHO labels && data
      whoTable: {},
      whoLabels: [],
      whoData: [],

      // this is what's shown on the chart at any moment
      // currently used data
      currentData: [],
      currentLabels: [],
    };

    // init values
    this.datasetLabel = "dataset label";
    this.titleText = `Ilość połączeń z dzisiaj`;
    this.weekDaysArr = ["Niedz", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob"];

    // this is for checking today's date
    this.dateToday = null;
    this.yearToday = null;
    this.monthToday = null;
    this.dayToday = null;
    this.dateStringToday = null;

    this.init();
  }

  resetData = () => {
    // console.log("resetData");

    // LANGUAGE
    this.chartData.languageTable = {};
    this.chartData.languageLabels = [];
    this.chartData.languageData = [];
    // SYSTEM
    this.chartData.systemTable = {};
    this.chartData.systemLabels = [];
    this.chartData.systemData = [];
    // DURATION
    this.chartData.durationTable = {};
    this.chartData.durationLabels = [];
    this.chartData.durationData = [];
    // DATES
    this.chartData.datesTable = {};
    this.chartData.datesLabels = [];
    this.chartData.datesData = [];
    // WHO
    this.chartData.whoTable = {};
    this.chartData.whoLabels = [];
    this.chartData.whoData = [];
  };

  init = () => {
    // console.log("init");

    // checking today's date
    this.dateToday = new Date();
    this.yearToday = this.dateToday.getFullYear();
    this.monthToday = this.dateToday.getMonth() + 1; // + 1 is adjusting 0-based months
    this.dayToday = this.dateToday.getDate();

    if (this.monthToday < 10) {
      this.monthToday = `0${this.monthToday}`;
    }
    if (this.dayToday < 10) {
      this.dayToday = `0${this.dayToday}`;
    }
    this.dateStringToday = `${this.yearToday}-${this.monthToday}-${this.dayToday}`;

    // setting max values for date input
    this.elements.rangeDateOne.max = this.dateStringToday;
    this.elements.rangeDateTwo.max = this.dateStringToday;

    this.initializeDataForToday();
    this.populateArraysWithData();

    // DATES RANGE LISTENERS
    this.rangeDates.forEach((rangeLimit, idx, arr) => {
      rangeLimit.addEventListener("change", () => {
        if (idx === 0 && rangeLimit.value) {
          this.ranges.from = rangeLimit.value;
          // setting the second range to minimum (value of the firset one)
          arr[idx + 1].min = rangeLimit.value;
        }
        if (idx === 1 && rangeLimit.value) {
          this.ranges.to = rangeLimit.value;
          // setting the second range to minimum (value of the firset one)
          arr[idx - 1].max = rangeLimit.value;
        }
        this.updateChart();
      });
    });

    this.chartData.currentData = this.chartData.datesData;
    this.chartData.currentLabels = this.chartData.datesLabels;

    // RESET CHART LISTENER
    this.elements.resetRange.addEventListener("click", () => {
      this.chart.destroy();

      this.ranges.from = null;
      this.ranges.to = null;
      this.elements.rangeDateOne.value = "";
      this.elements.rangeDateTwo.value = "";

      // setting min - max values for date input
      this.elements.rangeDateOne.max = this.dateStringToday;
      this.elements.rangeDateTwo.max = this.dateStringToday;
      this.elements.rangeDateTwo.min = "2021-09-16"; // data pierwszego wpisu do DB

      this.resetData();
      this.initializeDataForToday();
      this.populateArraysWithData();
      this.setCurrentDataArray();
      this.drawChart();
    });

    // PRESENTED DATA OPTIONS LISTENERS
    this.allOptions.forEach((option) => {
      option.addEventListener("click", (e) => {
        this.chart.destroy();
        this.switchPresentedData(option);
        this.extendSuggestedMaxY();
        this.drawChart();
      });
    });

    // setting suggested max 10% above max value (onload -> init)
    this.extendSuggestedMaxY();
    this.drawChart();
  };

  extendSuggestedMaxY = () => {
    // console.log("extendSuggestedMaxY");

    this.maxValue = Math.max(...this.chartData.currentData);
    this.suggestedMax = this.maxValue * 1.15;
  };

  // populations each option objects (HASH TABLES)
  populateHashTables = (dataEntry, dateString) => {
    // console.log("populateHashTables");
    if (dataEntry["language"] in this.chartData.languageTable) {
      this.chartData.languageTable[dataEntry["language"]] += 1;
    } else {
      this.chartData.languageTable[dataEntry["language"]] = 1;
    }
    // for SYSTEM
    if (dataEntry["system_version"] in this.chartData.systemTable) {
      this.chartData.systemTable[dataEntry["system_version"]] += 1;
    } else {
      this.chartData.systemTable[dataEntry["system_version"]] = 1;
    }
    // for DURATION
    if (dataEntry["duration"] in this.chartData.durationTable) {
      this.chartData.durationTable[dataEntry["duration"]] += 1;
    } else {
      this.chartData.durationTable[dataEntry["duration"]] = 1;
    }
    // for CALLS NUMBER
    if (dateString in this.chartData.datesTable) {
      this.chartData.datesTable[dateString] += 1;
    } else {
      this.chartData.datesTable[dateString] = 1;
    }
    // console.log(this.chartData.datesTable);
    // for WHO
    if (dataEntry["who"] in this.chartData.whoTable) {
      this.chartData.whoTable[dataEntry["who"]] += 1;
    } else {
      this.chartData.whoTable[dataEntry["who"]] = 1;
    }
    // console.log(this.chartData);
  };

  // by default prepares everyting for TODAY
  // DATA PREPARATION
  initializeDataForToday = () => {
    // console.log("initializeDataForToday");

    testData.forEach((dataEntry) => {
      // preparing dateString for dates
      const tmpDate = new Date(dataEntry["insert_date"] * 1000);
      const year = tmpDate.getFullYear();
      let month = tmpDate.getMonth() + 1; // adjusting 0-based months
      let day = tmpDate.getDate();
      if (month < 10) {
        month = `0${month}`;
      }
      if (day < 10) {
        day = `0${day}`;
      }
      const dateString = `${year}-${month}-${day}`;

      // (DEFAULT VIEW) - only today's data
      if (this.dateStringToday === dateString) {
        this.populateHashTables(dataEntry, dateString);
      }
    });
  };

  populateArraysWithData = () => {
    // console.log("populateArraysWithData");

    // creating SYSTEM dataset

    for (let value in this.chartData.languageTable) {
      this.chartData.languageLabels.push(value);
      this.chartData.languageData.push(this.chartData.languageTable[value]);
    }
    // creating SYSTEM dataset
    for (let value in this.chartData.systemTable) {
      this.chartData.systemLabels.push(value);
      this.chartData.systemData.push(this.chartData.systemTable[value]);
    }
    // creating DURATION dataset
    for (let value in this.chartData.durationTable) {
      // durationLabels.push(value);
      this.chartData.durationLabels = ["< 5 min", "5-15", "15-30", ">30"];
      this.chartData.durationData.push(this.chartData.durationTable[value]);
    }
    // temporaty crutch
    this.chartData.durationLabels.length = this.chartData.durationData.length;
    // creating DATES dataset
    for (let value in this.chartData.datesTable) {
      this.chartData.datesLabels.push(
        ` ${this.weekDaysArr[new Date(value).getDay()]} ${
          value.split("-")[2]
        }.${value.split("-")[1]}`
      );
      // datesLabels.push(value);
      this.chartData.datesData.push(this.chartData.datesTable[value]);
    }
    // creating WHO dataset
    for (let value in this.chartData.whoTable) {
      this.chartData.whoLabels.push(value);
      this.chartData.whoData.push(this.chartData.whoTable[value]);
    }
  };

  // a bit refactored. Further refactor required
  switchPresentedData = (option) => {
    // console.log("switchPresentedData");

    const rangesOptions = [
      !this.ranges.from && !this.ranges.to,
      this.ranges.from && !this.ranges.to,
      this.ranges.to && !this.ranges.from,
      this.ranges.from && this.ranges.to,
    ];

    // dictionary for title texts (with current view)
    const titleTextHash = {
      chartData__duration: [
        this.chartData.durationData,
        this.chartData.durationLabels,
        `Długość połączeń z dzisiaj`,
        `Długość połączeń: `,
      ],
      chartData__language: [
        this.chartData.languageData,
        this.chartData.languageLabels,
        `Język połączeń z dzisiaj`,
        `Język połączeń: `,
      ],
      chartData__system: [
        this.chartData.systemData,
        this.chartData.systemLabels,
        `Wersje systemów z dzisiaj`,
        `Wersje systemów: `,
      ],
      "chartData__calls-number": [
        this.chartData.datesData,
        this.chartData.datesLabels,
        `Ilość połączeń z dzisiaj`,
        `Ilość połączeń: `,
      ],
      chartData__who: [
        this.chartData.whoData,
        this.chartData.whoLabels,
        `Kto dzwonił z dzisiaj`,
        `Kto dzwonił: `,
      ],
    };

    // tmp crutch (maybe not needed)
    let monthFrom;
    let dayFrom;
    let monthTo;
    let dayTo;

    // some logic
    rangesOptions.forEach((o, idx) => {
      // console.log(idx);
      if (o) {
        for (let optionId in titleTextHash) {
          // console.log(option.id === optionId);
          if (option.id === optionId) {
            this.chartData.currentData = titleTextHash[optionId][0];
            this.chartData.currentLabels = titleTextHash[optionId][1];
            if (idx === 0) {
              // console.log(titleTextHash[optionId][2])
              this.titleText = `${titleTextHash[optionId][2]}`;
            } else if (idx === 1) {
              monthFrom = this.ranges.from.split("-")[1];
              dayFrom = this.ranges.from.split("-")[2];
              this.titleText = `${titleTextHash[optionId][3]} ${dayFrom}.${monthFrom} - ...`;
            } else if (idx === 2) {
              monthTo = this.ranges.to.split("-")[1];
              dayTo = this.ranges.to.split("-")[2];
              this.titleText = `${titleTextHash[optionId][3]} ... - ${dayTo}.${monthTo}`;
            } else if (idx === 3) {
              monthFrom = this.ranges.from.split("-")[1];
              dayFrom = this.ranges.from.split("-")[2];
              monthTo = this.ranges.to.split("-")[1];
              dayTo = this.ranges.to.split("-")[2];
              this.titleText = `${titleTextHash[optionId][3]} ${dayFrom}.${monthFrom} - ${dayTo}.${monthTo}`;
            }
          }
        }
      }
    });
  };

  setCurrentDataArray = () => {
    // updating the current option in chart after changing the rangeLimit
    this.allOptions.forEach((option) => {
      if (option.checked) {
        this.switchPresentedData(option);
      }
      this.extendSuggestedMaxY();
    });
  };

  updateChart = () => {
    if (this.ranges.from && !this.ranges.to) {
      this.resetData();
      this.chart.destroy();

      testData.forEach((dataEntry) => {
        const tmpDate = new Date(dataEntry["insert_date"] * 1000);
        const year = tmpDate.getFullYear();
        let month = tmpDate.getMonth() + 1; // adjusting 0-based months
        let day = tmpDate.getDate();
        if (month < 10) {
          month = `0${month}`;
        }
        if (day < 10) {
          day = `0${day}`;
        }
        const dateString = `${year}-${month}-${day}`;

        // preliminary RANGE logic
        if (
          new Date(this.ranges.from) <=
          new Date(dataEntry["insert_date"] * 1000)
        ) {
          this.populateHashTables(dataEntry, dateString);
        }
      });
      this.populateArraysWithData();
      this.setCurrentDataArray();
      this.drawChart();
    }

    if (this.ranges.to && !this.ranges.from) {
      this.resetData();
      this.chart.destroy();

      testData.forEach((dataEntry) => {
        const tmpDate = new Date(dataEntry["insert_date"] * 1000);
        const year = tmpDate.getFullYear();
        let month = tmpDate.getMonth() + 1; // adjusting 0-based months
        let day = tmpDate.getDate();
        if (month < 10) {
          month = `0${month}`;
        }
        if (day < 10) {
          day = `0${day}`;
        }
        const dateString = `${year}-${month}-${day}`;

        // preliminary RANGE logic
        if (
          new Date(dataEntry["insert_date"] * 1000) <=
          // advancing ranges.to to 23:59
          new Date(this.ranges.to).setHours(23, 59, 59, 59)
        ) {
          this.populateHashTables(dataEntry, dateString);
        }
      });
      this.populateArraysWithData();
      this.setCurrentDataArray();

      this.drawChart();
    }

    if (this.ranges.from && this.ranges.to) {
      this.resetData();
      this.chart.destroy();

      testData.forEach((dataEntry) => {
        const tmpDate = new Date(dataEntry["insert_date"] * 1000);
        const year = tmpDate.getFullYear();
        let month = tmpDate.getMonth() + 1; // adjusting 0-based months
        let day = tmpDate.getDate();
        if (month < 10) {
          month = `0${month}`;
        }
        if (day < 10) {
          day = `0${day}`;
        }
        const dateString = `${year}-${month}-${day}`;

        // preliminary RANGE logic
        if (
          new Date(this.ranges.from) <=
            new Date(dataEntry["insert_date"] * 1000) &&
          new Date(dataEntry["insert_date"] * 1000) <=
            // advancing ranges.to to 23:59
            new Date(this.ranges.to).setHours(23, 59, 59, 59)
        ) {
          this.populateHashTables(dataEntry, dateString);
        }
      });

      this.populateArraysWithData();
      this.setCurrentDataArray();
      this.drawChart();
    }
  };

  drawChart = () => {
    // console.log("drawChart");
    if (!this.chartType) {
      this.chartType = "bar";
    }

    // will change colors location
    let chartColorsArr = this.chartSettings.chartColorPalette;

    // mutating chartColorsArr to canvasGradient colors
    chartColorsArr = chartColorsArr.map((color) => {
      const tmpColor = this.elements.chartCtx.createLinearGradient(
        0,
        0,
        0,
        600,
        20
      );
      // first argument describes the gradient stop
      tmpColor.addColorStop(0.25, color);
      tmpColor.addColorStop(0.85, `rgba(${0xd2},${0xba},${0xaf},0`);
      tmpColor.addColorStop(1, `rgba(${0xd2},${0xba},${0xaf},0`);
      color = tmpColor;
      return color;
    });

    // console.log(this.chartData.currentLabels);
    this.chart = new Chart(this.elements.chartCtx, {
      type: this.chartType,
      data: {
        labels: this.chartData.currentLabels,
        datasets: [
          {
            label: this.datasetLabel,
            data: this.chartData.currentData,
            backgroundColor: chartColorsArr,
            borderColor: chartColorsArr,
            borderWidth: 1,
            // backgroundColor: this.colorPalette,
          },
        ],
      },
      plugins: [ChartDataLabels],
      options: {
        responsive: true,
        plugins: {
          // this is for the legend
          legend: {
            display: this.chartSettings.showLegend,
            // this applies only if showLegend === true
            position: "end",
            labels: {
              usePointStyle: true,
              font: {
                size: 20,
              },
            },
          },
          // this is for plugin labels
          datalabels: {
            color: this.chartSettings.columnsLabelColor,
            anchor: this.chartSettings.anchorPosition,
            align: this.chartSettings.alignPosition,
            offset: 5,
            font: {
              size: this.chartSettings.chartLabelsSize,
              weight: "bold",
            },
            clip: true,
          },
          // this is for the title
          title: {
            position: this.chartSettings.titlePosition,
            display: this.chartSettings.displayTitle,
            text: this.titleText,
            font: {
              size: this.chartSettings.chartHeaderSize,
            },
          },
        },
        scales: {
          y: {
            suggestedMax: this.suggestedMax,
            grid: {
              color: "#E0E0E0",
              borderColor: "#E0E0E0",
              tickColor: "#E0E0E0",
              borderDash: [5, 10],
              lineWidth: 1,
            },
          },
          x: {
            grid: {
              color: "#E0E0E0",
              borderColor: "#E0E0E0",
              tickColor: "#E0E0E0",
              borderDash: [5, 10],
              lineWidth: 1,
            },
          },
        },
      },
    });
  };
}

(function () {
  new ChartPage({});
})();
