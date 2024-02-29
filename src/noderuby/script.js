sensorBtn = document.getElementById("sensorBtn");
boardBtn = document.getElementById("boardBtn");
weatherStationBtn = document.getElementById("weatherStationBtn");

const forms = [
  document.getElementById("sensorForm"),
  document.getElementById("boardForm"),
  document.getElementById("stationForm"),
];
document.getElementById("clearBtn1").addEventListener("click", (event) => {
  clearForms(forms);
});
document.getElementById("clearBtn2").addEventListener("click", (event) => {
  clearForms(forms);
});
document.getElementById("clearBtn3").addEventListener("click", (event) => {
  clearForms(forms);
});
sensorBtn.addEventListener("click", (event) => {
  submitForm(event);
});
boardBtn.addEventListener("click", (event) => {
  submitForm(event);
});
weatherStationBtn.addEventListener("click", (event) => {
  submitForm(event);
});

function submitForm(event) {
  // Create an object to store the form data
  const formData = {};

  let excecuted = false;
  // Store the form data in the object
  if (event.target == sensorBtn && !excecuted) {
    formData.boardId = document.getElementById("boardIdS").value;
    formData.sensorId = document.getElementById("sensorId").value;
    formData.sensorName = document.getElementById("sensorName").value;
    //formData.securityKey = document.getElementById("key").value;
    excecuted = true;
  }
  if (event.target == boardBtn && !excecuted) {
    formData.boardId = document.getElementById("boardId").value;
    formData.boardName = document.getElementById("boardName").value;
    const boardLat = +document.getElementById("boardLat").value;
    if (isNaN(boardLat)) {
      alert("Latitude must be a number");
      return;
    } else {
      formData.boardLat = boardLat;
    }

    const boardLong = +document.getElementById("boardLong").value;
    if (isNaN(boardLong)) {
      alert("Longitude must be a number");
      return;
    } else {
      formData.boardLong = boardLong;
    }

    executed = true;
    //formData.securityKey = document.getElementById("key").value;
  }
  if (!excecuted) {
    formData.stationId = document.getElementById("stationId").value;
    formData.stationName = document.getElementById("stationName").value;
    //formData.stationLat = document.getElementById("stationLat").value;
    const stationLat = +document.getElementById("stationLat").value;
    if (isNaN(stationLat)) {
      alert("Latitude must be a number");
      return;
    } else {
      formData.stationLat = stationLat;
    }
    //formData.stationLong = document.getElementById("stationLong").value;
    const stationLong = +document.getElementById("stationLong").value;
    if (isNaN(stationLong)) {
      alert("Longitude must be a number");
      return;
    } else {
      formData.stationLong = stationLong;
    }
    //formData.securityKey = document.getElementById("key").value;
    excecuted = true;
  }

  // Check if all form fields are filled
  const formFields = Object.values(formData);
  //formFields.push(document.getElementById("key").value);
  if (formFields.some((field) => field.length <= 0)) {
    alert("All fields in a given form need to be filled");
    return;
  }

  // Clear all the forms
  clearForms(forms);
  // Send the form data to the server
  fetch("/submit-form", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  })
    .then((response) => {
      if (response.ok) {
        console.log("Form data sent successfully");
      } else {
        throw new Error("Form data failed to send");
      }
    })
    .catch((error) => {
      console.error(error);
    });
}

function clearForms(forms) {
  forms.forEach((form) => {
    form.reset();
  });
}
