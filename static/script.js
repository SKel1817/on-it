// Path to your JSON file
const jsonPath = "../static/auditsteps.json";

// Variables to store user responses
let currentStepIndex = 0;

// Fetch and process the JSON file
fetch(jsonPath)
  .then((response) => {
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.json();
  })
  .then((data) => {
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

    // Handle "Next Step" button click
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


