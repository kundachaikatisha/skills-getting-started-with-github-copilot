document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Fetch and display activities
  async function loadActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      for (const [name, details] of Object.entries(activities)) {
        // Build activity card
        const card = document.createElement("div");
        card.className = "activity-card";

        const title = document.createElement("h4");
        title.textContent = name;
        card.appendChild(title);

        const desc = document.createElement("p");
        desc.textContent = details.description;
        card.appendChild(desc);

        const schedule = document.createElement("p");
        schedule.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;
        card.appendChild(schedule);

        const availability = document.createElement("p");
        availability.innerHTML = `<strong>Availability:</strong> ${details.max_participants} spots`;
        card.appendChild(availability);

        // Participants section
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";
        participantsDiv.appendChild(participantsHeading);

        const members = details.members || details.participants || [];
        if (members.length > 0) {
          const ul = document.createElement("ul");
          members.forEach((member) => {
            const li = document.createElement("li");

            const span = document.createElement("span");
            span.textContent = member;
            li.appendChild(span);

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-btn";
            deleteBtn.title = "Unregister";
            deleteBtn.innerHTML = "&#x1f5d1;";
            deleteBtn.addEventListener("click", async () => {
              try {
                const res = await fetch(
                  `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(member)}`,
                  { method: "DELETE" }
                );
                const data = await res.json();
                if (res.ok) {
                  loadActivities();
                } else {
                  alert(data.detail || "Failed to unregister.");
                }
              } catch (err) {
                alert("An error occurred. Please try again.");
              }
            });
            li.appendChild(deleteBtn);

            ul.appendChild(li);
          });
          participantsDiv.appendChild(ul);
        } else {
          const none = document.createElement("p");
          none.className = "no-participants";
          none.textContent = "No participants yet — be the first!";
          participantsDiv.appendChild(none);
        }

        card.appendChild(participantsDiv);
        activitiesList.appendChild(card);

        // Populate select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      }
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities.</p>";
    }
  }

  // Handle sign-up form submission
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );
      const result = await response.json();

      messageDiv.classList.remove("hidden", "success", "error");
      if (response.ok) {
        messageDiv.classList.add("success");
        messageDiv.textContent = result.message || "Successfully signed up!";
        loadActivities(); // Refresh to show new participant
      } else {
        messageDiv.classList.add("error");
        messageDiv.textContent = result.detail || "Sign-up failed.";
      }
    } catch (error) {
      messageDiv.classList.remove("hidden", "success", "error");
      messageDiv.classList.add("error");
      messageDiv.textContent = "An error occurred. Please try again.";
    }
  });

  loadActivities();
});
