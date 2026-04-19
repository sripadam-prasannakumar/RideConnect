export const getDefaultAvatar = (role, email) => {
    const seed = email ? encodeURIComponent(email) : 'default';
    if (role === 'driver') {
        // Driver-style avatar (more likely to have facial hair/professional look)
        return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=b6e3f4`;
    }
    // Customer-style avatar (friendly human look)
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=ffdfbf`;
};
