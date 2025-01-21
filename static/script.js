const jsonPath = "../static/auditsteps.json";

// Variables to store user responses
let currentStepIndex = 0;
let selectedSteps = []; // Array to store the sequence of steps for "Yes" selections

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

    // Map of radio button selections to steps
    const stepMapping = {
      servers: "Step1a",       // servers
      applications: "Step1b",  // applications
      workstations: "Step1c",  // workstations
      cloudServices: "Step1d", // cloudServices
      devices: "Step1e",       // devices
      networkArchitecture: "Step1f",  // network architecture
    };

    // Function to display a step
    function displayStep(stepKey) {
      const step = steps[stepKey];

      // Update HTML with the step data
      document.getElementById("stepName").textContent = stepKey;
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

      // Show the radio buttons only on the first step (index 0)
      const radioButtons = document.querySelectorAll('label, input[type="radio"]');
      if (stepKey === "Step1") {
        radioButtons.forEach((elem) => {
          elem.style.display = "block"; // Show radio buttons
        });

        // Hide the input textbox during step 1
        document.getElementById("auditInput").style.display = "none";
      } else {
        radioButtons.forEach((elem) => {
          elem.style.display = "none"; // Hide radio buttons
        });

        // Show the input textbox for other steps
        document.getElementById("auditInput").style.display = "block";
      }
    }

    // Initial step display
    displayStep(stepKeys[currentStepIndex]);

    // Handle the "Next" button click
    document.getElementById("nextButton").addEventListener("click", () => {
      // If the user is on the first step (Step1)
      if (currentStepIndex === 0) {
        const selectedRadios = document.querySelectorAll('input[type="radio"]:checked');
        selectedSteps = []; // Reset selected steps

        selectedRadios.forEach((radio) => {
          const selectedName = radio.name; // e.g., "servers"
          const selectedValue = radio.value; // e.g., "Yes" or "No"

          if (selectedValue === "Yes" && stepMapping[selectedName]) {
            selectedSteps.push(stepMapping[selectedName]); // Add corresponding step for "Yes"
          }
        });

        if (selectedSteps.length > 0) {
          currentStepIndex = 0; // Reset to the first substep
          displayStep(selectedSteps[currentStepIndex]); // Display the first substep
        } else {
          alert("Please select at least one option with 'Yes' to proceed.");
        }
      } else {
        // Handle user input for subsequent steps
        const userInput = document.getElementById("auditInput").value.trim();

        if (userInput) {
          // Prepare the response object
          const stepName = selectedSteps[currentStepIndex];
          const response = {
            step: stepName,
            answer: userInput
          };

          // Log for debugging purposes
          console.log(`Submitting response for ${stepName}: ${userInput}`);

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
              console.log("Response saved:", data.message);

              // Move to the next substep within the same section (1a -> 1b -> 1c, etc.)
              if (currentStepIndex < selectedSteps.length - 1) {
                currentStepIndex++;
                displayStep(selectedSteps[currentStepIndex]);
              } else {
                // If all substeps in the current section are done, move to the next main step (2, 3, etc.)
                const nextMainStepIndex = Math.floor(currentStepIndex / 6) + 1; // 6 steps per main step (e.g., Step1a to Step1f)
                if (nextMainStepIndex < stepKeys.length) {
                  currentStepIndex = nextMainStepIndex * 6; // Jump to the first substep of the next main step
                  displayStep(stepKeys[currentStepIndex]);
                } else {
                  alert("You have completed all the steps.");
                }
              }
            })
            .catch((error) => {
              console.error("Error:", error);
              alert("Failed to save the response. Please try again.");
            });
        } else {
          alert("Please enter a response before proceeding.");
        }
      }
    });
  })
  .catch((error) => {
    console.error("There was a problem with the fetch operation:", error);
  });
