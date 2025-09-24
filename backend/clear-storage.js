if (typeof(Storage) !== 'undefined') {
    localStorage.removeItem('auth_token');
    sessionStorage.clear();
    console.log('Storage cleared');
    window.location.reload();
} else {
    console.log('No web storage support');
}
