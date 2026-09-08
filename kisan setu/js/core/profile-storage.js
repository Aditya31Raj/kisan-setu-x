const PROFILE_STORAGE_PREFIX = "kisanSetu.registrationProfile.";

function profileStorageKey(role) {
    return `${PROFILE_STORAGE_PREFIX}${role}`;
}

function saveRegistrationProfile(role, profile) {
    const safeProfile = { ...profile };
    delete safeProfile.password;
    delete safeProfile.confirmPassword;
    localStorage.setItem(profileStorageKey(role), JSON.stringify(safeProfile));
}

function getRegistrationProfile(role) {
    try {
        return JSON.parse(localStorage.getItem(profileStorageKey(role)) || "null");
    } catch {
        return null;
    }
}

function readProfilePicture(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve("");
            return;
        }
        if (!file.type.startsWith("image/")) {
            reject(new Error("Please select an image file."));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Unable to read the selected image."));
        reader.readAsDataURL(file);
    });
}

window.saveRegistrationProfile = saveRegistrationProfile;
window.getRegistrationProfile = getRegistrationProfile;
window.readProfilePicture = readProfilePicture;