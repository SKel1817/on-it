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
        password_conf: passwordConf, // <<–– Added field
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
// login existing user -- done
function login_user() {
  console.log("login_user is running...");
  const loginButton = document.getElementById("loginButton");
  if (!loginButton) {
    console.error("Login button not found!");
    return;
  }

  loginButton.addEventListener("click", function (e) {
    // No need for e.preventDefault() here since we're not in a submit event.
    console.log("Login button clicked!");

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
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password
        }),
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Login failed");
        }
        return response.json();
      })
      .then((data) => {
        alert(data.message);
        window.location.href = "/"; // Redirect after successful login
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Login failed: " + error.message);
      });
  });
}


// update existing user account -- to be made


// END OF USER LOGIC -------------------------------------------------------------------------------------


//AUDIT LOGIC ------------------------------------------------------------------------------
// Variable to store user repsonses
// Global variables for navigation
// Global variables for navigation
let currentStepIndex = 0;
let combinedSteps = []; // Will store the full branch: Step1 selections, Step2 equivalents, then remaining steps.
let decisionComplete = false; // Flag to indicate the decision step has been processed

function fetchAuditSteps() {
  fetch("/get_audit_steps")
    .then(response => {
      if (!response.ok) throw new Error("Failed to fetch audit steps.");
      return response.json();
    })
    .then(data => {
      const steps = data.CybersecurityAudit;
      const stepKeys = Object.keys(steps);
      // Mapping for decision radio buttons for Step1.
      // (These keys come from the radio button names for Step1.)
      const step1Mapping = {
        servers: "Step1a",
        applications: "Step1b",
        workstations: "Step1c",
        cloudServices: "Step1d",
        devices: "Step1e",
        networkArchitecture: "Step1f",
      };

      // Also define what keys belong to Step2 decisions so we can filter them later.
      const step2Mapping = {
        servers: "Step2a",
        applications: "Step2b",
        workstations: "Step2c",
        cloudServices: "Step2d",
        devices: "Step2e",
        networkArchitecture: "Step2f",
      };

      // Function to display a step
      function displayStep(stepKey) {
        const step = steps[stepKey];
        document.getElementById("stepName").textContent = stepKey;
        document.getElementById("instruction").textContent = step.Instruction;
        document.getElementById("explanation").textContent = step.Explanation;

        // Display example output
        const exampleDiv = document.getElementById("example");
        exampleDiv.innerHTML = "<strong>Example:</strong><br>";
        for (const [key, value] of Object.entries(step.Example)) {
          exampleDiv.innerHTML += `${key}: ${value}<br>`;
        }

        // Clear the input field
        document.getElementById("auditInput").value = "";

        // For decision steps (Step1 or Step2) show radio options.
        // Since we are only using a decision for Step1, we show them only when the current step is Step1.
        const radioOptions = document.getElementById("radioOptions");
        if (stepKey === "Step1" || stepKey === "Step2") {
          radioOptions.style.display = "block";
          document.getElementById("auditInput").style.display = "none";
        } else {
          radioOptions.style.display = "none";
          document.getElementById("auditInput").style.display = "block";
        }
        // update progress bar
        updateProgressBar();
      }

      // Start by displaying the decision step "Step1"
      displayStep("Step1");

      document.getElementById("nextButton").addEventListener("click", () => {
        // Get current step from the UI.
        const currentStep = document.getElementById("stepName").textContent;

        // If we're at the decision step ("Step1") and haven't processed it yet:
        if (currentStep === "Step1" && !decisionComplete) {
          const selectedRadios = document.querySelectorAll('input[type="radio"]:checked');
          let selectedSteps1 = [];
          selectedRadios.forEach((radio) => {
            const selectedName = radio.name;
            const selectedValue = radio.value;
            if (selectedValue === "Yes" && step1Mapping[selectedName]) {
              selectedSteps1.push(step1Mapping[selectedName]);
            }
          });

          if (selectedSteps1.length > 0) {
            // Automatically compute corresponding Step2 substeps by replacing "Step1" with "Step2"
            const selectedSteps2 = selectedSteps1.map(step => step.replace("Step1", "Step2"));
            // Build remaining steps:
            // Filter out decision steps and their substeps (both for Step1 and Step2)
            const decisionSubSteps = Object.values(step1Mapping).concat(Object.values(step2Mapping));
            const remainingSteps = stepKeys.filter(key => key !== "Step1" && key !== "Step2" && !decisionSubSteps.includes(key));
            // Combined branch: first process the selected Step1 substeps, then the corresponding Step2 substeps, then any remaining steps.
            combinedSteps = selectedSteps1.concat(selectedSteps2).concat(remainingSteps);
            decisionComplete = true;
            currentStepIndex = 0;
            displayStep(combinedSteps[currentStepIndex]);
          } else {
            alert("Please select at least one option with 'Yes' for Step1 to proceed.");
          }
        } else {
          // For non-decision steps (or after processing the decision), save the response and move to the next step.
          const userInput = document.getElementById("auditInput").value.trim();
          if (!userInput) {
            alert("Please enter a response before proceeding.");
            return;
          }
          // Determine the current branch (we are using combinedSteps here)
          const stepName = combinedSteps[currentStepIndex];
          const response = {
            response_step: stepName,
            response_answer: userInput
          };

          fetch("/save_response", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(response),
            })
            .then((res) => {
              if (!res.ok) {
                throw new Error("Failed to save response.");
              }
              return res.json();
            })
            .then((data) => {
              console.log(data.message);
              currentStepIndex++;
              if (currentStepIndex < combinedSteps.length) {
                displayStep(combinedSteps[currentStepIndex]);
              } else {
                alert("You've completed all the steps! Responses saved.");
                // Optionally reset flags/indexes if you want to restart the flow.
                updateProgressBar(); // Ensure progress bar shows 100%
              }
            })
            .catch((error) => {
              console.error("Error:", error);
              alert("Failed to save the response. Please try again.");
            });
        }
      });
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });
}

// //Progress tracker code!! updates dynamically
// Update progress bar based on current step and total steps
function updateProgressBar() {
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");

  // If decision hasn't been made yet, treat the decision step as one step
  let totalSteps = decisionComplete ? combinedSteps.length : 1;
  let currentProgress = decisionComplete ? currentStepIndex : 0;
  let progressPercentage = totalSteps > 0 ? (currentProgress / totalSteps) * 100 : 0;
  progressPercentage = Math.min(Math.max(progressPercentage, 0), 100);

  progressBar.style.width = `${progressPercentage}%`;
  progressText.textContent = `Progress: ${Math.round(progressPercentage)}%`;
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
        const instruction = data.steps[item.step] ? .Instruction || "Instruction not available";
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


// Initialize the page don in each html file 