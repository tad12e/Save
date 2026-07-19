const sidebarItems = document.querySelectorAll('.nav-item');

sidebarItems.forEach((item) => {
  item.addEventListener('click', (event) => {
    sidebarItems.forEach((node) => node.classList.remove('active'));
    event.currentTarget.classList.add('active');
  });
});
