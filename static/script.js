// Variable to store user repsonses
let currentStepIndex = 0;

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
// Function to fetch and display frameworks - learn.html page
function fetchFrameworks() {
  fetch("/get_frameworks")
    .then(response => {
      if (!response.ok) throw new Error("Failed to fetch frameworks.");
      return response.json();
    })
    .then(data => {
      const frameworks = data.frameworks;
      const dropdown = document.getElementById("frameworkDropdown");
      const detailsDiv = document.getElementById("frameworkDetails");

      frameworks.forEach((framework, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = framework.name;
        dropdown.appendChild(option);
      });

      dropdown.addEventListener("change", event => {
        const selectedIndex = event.target.value;
        if (selectedIndex) {
          const selectedFramework = frameworks[selectedIndex];
          detailsDiv.innerHTML = `
            <h2>${selectedFramework.name}</h2>
            <p><strong>Definition:</strong> ${selectedFramework.definition}</p>
            <ul>${selectedFramework.how_to_use.map(step => `<li>${step}</li>`).join("")}</ul>
            <ul>${selectedFramework.advantages.map(adv => `<li>${adv}</li>`).join("")}</ul>
            <ul>${selectedFramework.disadvantages.map(disadv => `<li>${disadv}</li>`).join("")}</ul>
            <a href="${selectedFramework.link}" target="_blank">Learn more</a>
          `;
        } else {
          detailsDiv.innerHTML = "";
        }
      });
    })
    .catch(error => console.error("Error fetching frameworks:", error));
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
          <button onclick="viewReport('${date}')">View Report</button>
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