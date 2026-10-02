// BeautyBook demo: the real frontend ported to plain HTML/CSS/JS (projects/beauty-booking/app), shown in an iframe.
export function createBeautyBookDemo({ lang, root }) {
  const ru = lang === 'ru';
  return {
    type: 'frame',
    title: ru ? 'BeautyBook — интерактивная версия' : 'BeautyBook — interactive version',
    src: root('projects/beauty-booking/app/'),
    host: 'beautybook.ru/#',
    start: '/',
    roles: [
      { id: 'client', label: ru ? 'Клиент' : 'Customer', route: ['/demo/client?to=/'] },
      { id: 'owner', label: ru ? 'Владелец салона' : 'Salon owner', route: ['/demo/owner'] },
      { id: 'admin', label: ru ? 'Администратор' : 'Admin', route: ['/demo/admin'] }
    ],
    roleOf: path => (path.startsWith('/dashboard') ? 'owner' : path.startsWith('/admin') ? 'admin' : 'client'),
    screens: {
      catalog: ['/search'],
      booking: ['/booking/forma-beauty'],
      account: ['/demo/client?to=/account'],
      owner: ['/demo/owner']
    }
  };
}
