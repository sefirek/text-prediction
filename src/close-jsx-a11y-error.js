window.addEventListener('load', () => {
  setTimeout(() => {
    const iframe = document.getElementById('webpack-dev-server-client-overlay');
    if (iframe) {
      const { contentDocument } = iframe;
      if (contentDocument.body.innerHTML.includes('jsx-a11y')) {
        iframe.remove();
      }
    }
  }, 100);
});
