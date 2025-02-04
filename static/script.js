// Variable to store user repsonses
let currentStepIndex = 0;

let selectedSteps = []; // Array to store the sequence of steps for "Yes" selections

// Fetch and process the information - audit.html page
function fetchAuditSteps() {
  fetch("/get_audit_steps")
    .then(response => {
      if (!response.ok) throw new Error("Failed to fetch audit steps.");
      return response.json();
    })
    .then(data => {
      const steps = data.CybersecurityAudit;
      const stepKeys = Object.keys(steps);

      const stepMapping = {
        servers: "Step1a",
        applications: "Step1b",
        workstations: "Step1c",
        cloudServices: "Step1d",
        devices: "Step1e",
        networkArchitecture: "Step1f",
      };
  
      function displayStep(stepKey) {
        const step = steps[stepKey];
        document.getElementById("stepName").textContent = stepKey;
        document.getElementById("instruction").textContent = step.Instruction;
        document.getElementById("explanation").textContent = step.Explanation;
  
        const exampleDiv = document.getElementById("example");
        exampleDiv.innerHTML = "<strong>Example:</strong><br>";
        for (const [key, value] of Object.entries(step.Example)) {
          exampleDiv.innerHTML += `${key}: ${value}<br>`;
        }
  
        document.getElementById("auditInput").value = "";
  
        const radioOptions = document.getElementById("radioOptions");
        if (stepKey === "Step1") {
          radioOptions.style.display = "block";
          document.getElementById("auditInput").style.display = "none";
        } else {
          radioOptions.style.display = "none";
          document.getElementById("auditInput").style.display = "block";
        }
      }
  
      displayStep(stepKeys[currentStepIndex]);
  
      document.getElementById("nextButton").addEventListener("click", () => {
        if (currentStepIndex === 0) {
          const selectedRadios = document.querySelectorAll('input[type="radio"]:checked');
          selectedSteps = [];
          selectedRadios.forEach((radio) => {
            const selectedName = radio.name;
            const selectedValue = radio.value;
            if (selectedValue === "Yes" && stepMapping[selectedName]) {
              selectedSteps.push(stepMapping[selectedName]);
            }
          });
  
          if (selectedSteps.length > 0) {
            currentStepIndex = 0;
            displayStep(selectedSteps[currentStepIndex]);
          } else {
            alert("Please select at least one option with 'Yes' to proceed.");
          }
        } else {
          const userInput = document.getElementById("auditInput").value.trim();
          if (userInput) {
            const stepName = selectedSteps[currentStepIndex];
            const response = { step: stepName, answer: userInput };
  
            fetch("/save_response", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            })
              .then((res) => res.json())
              .then((data) => {
                if (currentStepIndex < selectedSteps.length - 1) {
                  currentStepIndex++;
                  displayStep(selectedSteps[currentStepIndex]);
                } else {
                  alert("You have completed all the steps.");
                }
              })
              .catch((error) => alert("Failed to save the response."));
          } else {
            alert("Please enter a response before proceeding.");
          }
        }
      });
    })
    .catch((error) => console.error("Fetch error:", error));
  }

// Function to Load previous audits and display them
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

// Redirect to the report page with the selected date
function viewReport(date) {
  const formattedDate = new Date(date).toISOString().split("T")[0];
  window.location.href = `/report?date=${encodeURIComponent(formattedDate)}`;
}

// Load the report for a specific date
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

// Download the PDF
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

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  fetchAuditSteps();
  fetchFrameworks();
});