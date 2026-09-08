
async function loadFarmerProfile() {
    return getFarmerProfile();
}



async function saveFarmerProfile(profile) {
    return updateFarmerProfile(profile);
}

document.addEventListener("DOMContentLoaded", async function () {
	const form = document.getElementById("profileForm");
	if (!form) return;

	const registrationProfile = getRegistrationProfile("farmer") || {};
	let currentProfile = { ...registrationProfile };
	setFarmerProfileEditable(false);

	try {
		const apiProfile = await getFarmerProfile();
		currentProfile = { ...currentProfile, ...(apiProfile || {}) };
	} catch (error) {
		console.warn("Farmer API profile unavailable; using registration profile.", error);
	}
	populateFarmerProfile(currentProfile);

	document.getElementById("editProfileBtn")?.addEventListener("click", function () {
		setFarmerProfileEditable(true);
		document.getElementById("name")?.focus();
	});

	document.getElementById("profilePictureInput")?.addEventListener("change", async function () {
		try {
			currentProfile.profilePicture = await readProfilePicture(this.files[0]);
			showFarmerPicture(currentProfile.profilePicture);
		} catch (error) {
			document.getElementById("profileMessage").innerHTML = `<div class="error-message">${error.message}</div>`;
		}
	});

	form.addEventListener("submit", async function (event) {
		event.preventDefault();
		const payload = {
			name: document.getElementById("name").value.trim(),
			farmName: document.getElementById("farmName").value.trim(),
			district: document.getElementById("district").value.trim(),
			state: document.getElementById("state").value.trim(),
			profilePicture: currentProfile.profilePicture || ""
		};
		const msg = document.getElementById("profileMessage");
		try {
			await updateFarmerProfile(payload);
			saveRegistrationProfile("farmer", { ...currentProfile, ...payload });
			currentProfile = { ...currentProfile, ...payload };
			msg.innerHTML = `<div class="success-message">Profile updated successfully.</div>`;
			setFarmerProfileEditable(false);
			populateFarmerProfile(currentProfile);
		} catch (error) {
			saveRegistrationProfile("farmer", { ...currentProfile, ...payload });
			currentProfile = { ...currentProfile, ...payload };
			msg.innerHTML = `<div class="error-message">Saved locally. ${error.message || "Profile update failed."}</div>`;
			setFarmerProfileEditable(false);
			populateFarmerProfile(currentProfile);
		}
	});
});

function setFarmerProfileEditable(editable) {
	const form = document.getElementById("profileForm");
	const pictureInput = document.getElementById("profilePictureInput");
	const saveButton = document.getElementById("saveProfileBtn");
	if (form) form.querySelectorAll("input:not([readonly])").forEach((input) => { input.disabled = !editable; });
	if (pictureInput) pictureInput.disabled = !editable;
	if (saveButton) saveButton.disabled = !editable;
}

function showFarmerPicture(profilePicture) {
	const preview = document.getElementById("profilePicturePreview");
	if (preview && profilePicture) preview.src = profilePicture;
}

function populateFarmerProfile(values) {
	const fields = {
		name: values.name || values.fullName || "",
		email: values.email || "",
		phone: values.phone || "",
		farmName: values.farmName || "",
		district: values.district || "",
		state: values.state || ""
	};
	Object.entries(fields).forEach(([id, value]) => {
		const field = document.getElementById(id);
		if (field) field.value = value;
	});
	const displayName = document.getElementById("profileDisplayName");
	const sidebarName = document.querySelector(".user-info strong");
	if (displayName) displayName.textContent = fields.name || "Farmer Profile";
	if (sidebarName) sidebarName.textContent = fields.name || "Farmer";
	showFarmerPicture(values.profilePicture || values.profileImage || "");
}

window.loadFarmerProfile = loadFarmerProfile;
window.saveFarmerProfile = saveFarmerProfile;
