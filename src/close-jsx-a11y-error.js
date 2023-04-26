window.addEventListener('load', () => {
<<<<<<< HEAD
  const iframe = document.getElementById('webpack-dev-server-client-overlay');
  if (iframe) {
    const { contentDocument } = iframe;
    if (contentDocument.body.innerHTML.includes('jsx-a11y')) {
      iframe.remove();
    }
  }
=======
  setTimeout(() => {
    const iframe = document.getElementById('webpack-dev-server-client-overlay');
    if (iframe) {
      const { contentDocument } = iframe;
      if (contentDocument.body.innerHTML.includes('jsx-a11y')) {
        iframe.remove();
      }
    }
  }, 100);
>>>>>>> af5b50e4cabd1dcaa66c4b7f5544e6faca5c8b90
});
