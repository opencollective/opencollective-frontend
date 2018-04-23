const image1 = '/static/images/avatar-01.svg';
const image2 = '/static/images/avatar-02.svg';
const image3 = '/static/images/avatar-03.svg';
const image4 = '/static/images/avatar-04.svg';

const avatars = [image1, image2, image3, image4];

const logos = [
  '/public/images/code.svg',
  '/public/images/rocket.svg',
  '/public/images/repo.svg',
];

export function pickAvatar(NameOrId) {
  return pickRandomImage(avatars, NameOrId);
}

export function pickLogo(NameOrId) {
  return pickRandomImage(logos, NameOrId);
}

export function pickRandomImage(images, NameOrId = 0) {
  let number = 0;
  if (isNaN(NameOrId)) {
    for (let i = 0; i < NameOrId.length; i++) {
      number += NameOrId.charCodeAt(i);
    }
  } else {
    number = NameOrId;
  }
  return images[number % 4];
}
