async function loadBuyerProfile() {
    return getBuyerProfile();
}

async function saveBuyerProfile(profile) {
    return updateBuyerProfile(profile);
}

function setBuyerProfileEditable(editable) {
    const form = document.getElementById("profileForm");
    const pictureInput = document.getElementById("profilePictureInput");
    const saveButton = document.getElementById("saveProfileBtn");
    if (form) form.querySelectorAll("input:not([readonly])").forEach((input) => { input.disabled = !editable; });
    if (pictureInput) pictureInput.disabled = !editable;
    if (saveButton) saveButton.disabled = !editable;
}

function showBuyerPicture(profilePicture) {
    const preview = document.getElementById("profilePicturePreview");
    if (preview && profilePicture) preview.src = profilePicture;
}

function populateBuyerProfile(values) {
    const fields = {
        name: values.name || values.ownerName || "",
        email: values.email || "",
        phone: values.phone || values.mobile || "",
        businessName: values.businessName || "",
        businessType: values.businessType || values.buyerType || "",
        district: values.district || "",
        state: values.state || ""
    };
    Object.entries(fields).forEach(([id, value]) => {
        const field = document.getElementById(id);
        if (field) field.value = value;
    });
    const displayName = document.getElementById("profileDisplayName");
    const sidebarName = document.querySelector(".user-info strong");
    if (displayName) displayName.textContent = fields.name || fields.businessName || "Buyer Profile";
    if (sidebarName) sidebarName.textContent = fields.businessName || fields.name || "Buyer / Vendor";
    showBuyerPicture(values.profilePicture || values.profileImage || "");
}

document.addEventListener("DOMContentLoaded", async function () {
    const form = document.getElementById("profileForm");
    if (!form) return;

    const registrationProfile = getRegistrationProfile("buyer") || {};
    let currentProfile = { ...registrationProfile };
    setBuyerProfileEditable(false);

    try {
        const apiProfile = await getBuyerProfile();
        currentProfile = { ...currentProfile, ...(apiProfile || {}) };
    } catch (error) {
        console.warn("Buyer API profile unavailable; using registration profile.", error);
    }
    populateBuyerProfile(currentProfile);

    document.getElementById("editProfileBtn")?.addEventListener("click", function () {
        setBuyerProfileEditable(true);
        document.getElementById("name")?.focus();
    });

    document.getElementById("profilePictureInput")?.addEventListener("change", async function () {
        try {
            currentProfile.profilePicture = await readProfilePicture(this.files[0]);
            showBuyerPicture(currentProfile.profilePicture);
        } catch (error) {
            document.getElementById("profileMessage").innerHTML = `<div class="error-message">${error.message}</div>`;
        }
    });

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        const payload = {
            name: document.getElementById("name").value.trim(),
            businessName: document.getElementById("businessName").value.trim(),
            businessType: document.getElementById("businessType").value.trim(),
            district: document.getElementById("district").value.trim(),
            state: document.getElementById("state").value.trim(),
            profilePicture: currentProfile.profilePicture || ""
        };
        const msg = document.getElementById("profileMessage");
        try {
            await updateBuyerProfile(payload);
            saveRegistrationProfile("buyer", { ...currentProfile, ...payload });
            currentProfile = { ...currentProfile, ...payload };
            msg.innerHTML = `<div class="success-message">Profile updated successfully.</div>`;
            setBuyerProfileEditable(false);
            populateBuyerProfile(currentProfile);
        } catch (error) {
            saveRegistrationProfile("buyer", { ...currentProfile, ...payload });
            currentProfile = { ...currentProfile, ...payload };
            msg.innerHTML = `<div class="error-message">Saved locally. ${error.message || "Profile update failed."}</div>`;
            setBuyerProfileEditable(false);
            populateBuyerProfile(currentProfile);
        }
    });
});

window.loadBuyerProfile = loadBuyerProfile;
window.saveBuyerProfile = saveBuyerProfile;
