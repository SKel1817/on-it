//confirm it's running
console.log("Script is running...");
// START of API DATABASE SUPPORTING LOGIC -------------------------------------------------------------------------------------
//USER LOGIC -------------------------------------------------------------------------------------
//Create User logic
function create_user() {
  console.log("Setting up form submission...");

  const form = document.getElementById("signup-form");
  const businessYes = document.getElementById("businessYes");
  const businessNo = document.getElementById("businessNo");
  const businessFields = document.getElementById("businessFields");

  // Toggle business fields visibility
  businessYes.addEventListener("change", () => {
    businessFields.style.display = "block";
  });

  businessNo.addEventListener("change", () => {
    businessFields.style.display = "none";
  });

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault(); // Prevent default form submission

      const password = document.getElementById("password").value;
      const passwordConf = document.getElementById("passwordConf").value;

      // Validate password confirmation
      if (!password || password !== passwordConf) {
        alert("Passwords do not match. Please try again.");
        return;
      }

      const isBusiness = document.querySelector("input[name='businessIndicator']:checked").value === "1";

      const formData = {
        first_name: document.getElementById("fname").value,
        last_name: document.getElementById("lname").value,
        username: document.getElementById("username").value,
        email: document.getElementById("email").value,
        password: password,
        familarity_with_audits: document.getElementById("slider").value,
        business_indicator: isBusiness ? 1 : 0, // Store as 1 for Yes, 0 for No
        role: isBusiness ? document.getElementById("role").value || "N/A" : "N/A",
        company: isBusiness ? document.getElementById("company").value || "N/A" : "N/A",
      };

      fetch("/create_user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formData),
        })
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            alert("Error: " + data.error);
          } else {
            alert("User created successfully!");
            window.location.href = "/login"; // Redirect to login
          }
        })
        .catch((error) => console.error("Error:", error));
    });
  } else {
    console.error("Signup form not found!");
  }
}
// login existing user -- to be made
function login_user() {
  console.log("login_user is running...");
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) {
    console.error("Login form not found!");
    return;
  }

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault(); // Prevent the default behavior
    console.log("Form submission intercepted!");

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) {
      console.error("Username or password is missing");
      alert("Please fill in both username and password.");
      return;
    }

    console.log("Sending login request to API...");
    fetch("/login-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Ensure this is explicitly set
      },
      body: JSON.stringify({ username, password }), // Send JSON
    });
  //     .then((response) => {
  //       if (!response.ok) {
  //         throw new Error("Login failed");
  //       }
  //       return response.json();
  //     })
  //     .then((data) => {
  //       alert(data.message);
  //       window.location.href = "/"; // Redirect after successful login
  //     })
  //     .catch((error) => {
  //       console.error("Error:", error);
  //       alert("Login failed: " + error.message);
  //     });
  });
}

// update existing user account -- to be made


// END OF USER LOGIC -------------------------------------------------------------------------------------


//AUDIT LOGIC ------------------------------------------------------------------------------
// Variable to store user repsonses
let currentStepIndex = 0;

// Fetch and process the information - audit.html page -- Fixed and done with database now
function fetchAuditSteps() {
  fetch("/get_audit_steps")
    .then(response => {
      if (!response.ok) throw new Error("Failed to fetch audit steps.");
      return response.json();
    })
    .then(data => {
      const steps = data.CybersecurityAudit;
      const stepKeys = Object.keys(steps);

      // Function to display a step
      function displayStep(stepIndex) {
        const step = steps[stepKeys[stepIndex]];

        // Update HTML with the step data
        document.getElementById("stepName").textContent = stepKeys[stepIndex];
        document.getElementById("instruction").textContent = step.Instruction;
        document.getElementById("explanation").textContent = step.Explanation;

        // Example content formatting
        const exampleDiv = document.getElementById("example");
        exampleDiv.innerHTML = "<strong>Example:</strong><br>";
        for (const [key, value] of Object.entries(step.Example)) {
          exampleDiv.innerHTML += `${key}: ${value}<br>`;
        }

        // Clear the input field
        document.getElementById("auditInput").value = "";
      }

      // Initial step display
      displayStep(currentStepIndex);

      // Handle "Next Step" button click - audit.html page, will need to be replaced with database logic 
      document.getElementById("nextButton").addEventListener("click", () => {
        const userInput = document.getElementById("auditInput").value.trim();

        if (userInput) {
          // Save the user response
          const stepName = stepKeys[currentStepIndex];
          const response = {
            step: stepName,
            answer: userInput
          };

          // Send the response to the backend
          fetch("/save_response", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(response)
            })
            .then((res) => {
              if (!res.ok) {
                throw new Error("Failed to save response.");
              }
              return res.json();
            })
            .then((data) => {
              console.log(data.message);
              // Move to the next step or finish
              currentStepIndex++;
              if (currentStepIndex < stepKeys.length) {
                displayStep(currentStepIndex);
              } else {
                alert("You've completed all the steps! Responses saved.");
                currentStepIndex = 0;
                displayStep(currentStepIndex);
              }
            })
            .catch((error) => {
              console.error("Error:", error);
              alert("Failed to save the response. Please try again.");
            });
        } else {
          alert("Please enter a response before proceeding.");
        }
      });
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });
}
// END OF AUDIT LOGIC -------------------------------------------------------------------------------------

// BEGIN OF REPORT LOGIC -------------------------------------------------------------------------------------
// Function to Load previous audits and display them - start by loading the dates
function loadAudits() {
  fetch("/get_audit_dates")
    .then(response => {
      if (!response.ok) throw new Error("Failed to load audit dates.");
      return response.json();
    })
    .then(data => {
      const auditList = document.getElementById("audit-list");
      if (data.dates.length === 0) {
        auditList.innerHTML = "<li>No audits found.</li>";
        return;
      }
      data.dates.forEach(date => {
        const li = document.createElement("li");
        li.innerHTML = `
          <span>${date}</span>
          <button onclick="viewReport('${date}')"><i class="material-symbols-outlined">table_eye</i></button>
        `;
        auditList.appendChild(li);
      });
    })
    .catch(error => {
      console.error("Error loading audits:", error);
      const auditList = document.getElementById("audit-list");
      auditList.innerHTML = "<li>Error loading audits. Please try again later.</li>";
    });
}

// Redirect to the report page with the selected date - then redirect
function viewReport(date) {
  const formattedDate = new Date(date).toISOString().split("T")[0];
  window.location.href = `/report?date=${encodeURIComponent(formattedDate)}`;
}

// Load the report for a specific date - load logic
function loadReport(date) {
  fetch(`/get_report_data?date=${encodeURIComponent(date)}`)
    .then(response => {
      if (!response.ok) throw new Error("Failed to load report data.");
      return response.json();
    })
    .then(data => {
      document.getElementById("report-date").textContent = date;

      const stepsBody = document.getElementById("steps-body");
      if (data.responses.length === 0) {
        stepsBody.innerHTML = `<tr><td colspan="3">No data found for this date.</td></tr>`;
        return;
      }

      let stepsHTML = "";
      data.responses.forEach(item => {
        const stepName = item.step || "N/A";
        const instruction = data.steps[item.step]?.Instruction || "Instruction not available";
        const response = item.answer || "No response provided";
        stepsHTML += `
          <tr>
            <td>${stepName}</td>
            <td>${instruction}</td>
            <td>${response}</td>
          </tr>
        `;
      });
      stepsBody.innerHTML = stepsHTML;
    })
    .catch(error => {
      console.error("Error loading report:", error);
      const stepsBody = document.getElementById("steps-body");
      stepsBody.innerHTML = `<tr><td colspan="3">Error loading report. Please try again later.</td></tr>`;
    });
}

// Download the PDF - finally download
function downloadPDF(date) {
  if (!date) {
    alert("Date is missing. Please select a valid audit date.");
    return;
  }

  fetch(`/generate_pdf?date=${encodeURIComponent(date)}`)
    .then(response => {
      if (!response.ok) throw new Error("Failed to download PDF.");
      return response.blob();
    })
    .then(blob => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `audit_${date.replace(/-/g, "_")}.pdf`;
      link.click();
    })
    .catch(error => {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF. Please try again.");
    });
}
// END OF REPORT LOGIC -------------------------------------------------------------------------------------

//FRAMEWORK LOGIC -------------------------------------------------------------------------------------

// Function to fetch and display frameworks - learn.html page
function fetchFrameworks() {
  console.log("Fetching frameworks...");

  fetch("/get_frameworks")
    .then((response) => {
      console.log("API Response Status:", response.status);
      if (!response.ok) throw new Error("Failed to fetch frameworks.");
      return response.json();
    })
    .then((data) => {
      console.log("API Data Received:", data);

      const frameworks = data.frameworks;
      const dropdown = document.getElementById("frameworkDropdown");
      const detailsDiv = document.getElementById("frameworkDetails");

      // Clear the dropdown first
      dropdown.innerHTML = '<option value="">--Select a Framework--</option>';

      // Populate the dropdown with framework names
      frameworks.forEach((framework, index) => {
        console.log("Adding Framework to Dropdown:", framework.name);

        const option = document.createElement("option");
        option.value = index; // Index for reference
        option.textContent = framework.name; // Set the option's display text to the framework name
        dropdown.appendChild(option);
      });

      // Handle dropdown selection
      dropdown.addEventListener("change", (event) => {
        const selectedIndex = event.target.value;
        if (selectedIndex) {
          const selectedFramework = frameworks[selectedIndex];

          const formatList = (items) =>
            items.map((item) => `<li>${item.replace(/\n/g, " ")}</li>`).join("");

          detailsDiv.innerHTML = `
            <h2>${selectedFramework.name}</h2>
            <p><strong>Definition:</strong> ${selectedFramework.definition}</p>
            <h3>How to Use:</h3>
            <ul>${formatList(selectedFramework.how_to_use)}</ul>
            <h3>Advantages:</h3>
            <ul>${formatList(selectedFramework.advantages)}</ul>
            <h3>Disadvantages:</h3>
            <ul>${formatList(selectedFramework.disadvantages)}</ul>
            <a href="${selectedFramework.link}" target="_blank">Learn more</a>
          `;
        } else {
          detailsDiv.innerHTML = "";
        }
      });
    })
    .catch((error) => console.error("Error fetching frameworks:", error));
}

// END OF FRAMEWORK LOGIC -------------------------------------------------------------------------------------
// END OF API DATABASE SUPPORTING LOGIC -------------------------------------------------------------------------------------

// general page script functions


// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  fetchAuditSteps();
  fetchFrameworks();
  create_user();
  login_user();
});