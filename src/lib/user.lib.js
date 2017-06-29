const avatar1 = '/static/images/avatar-01.svg';
const avatar2 = '/static/images/avatar-02.svg';
const avatar3 = '/static/images/avatar-03.svg';
const avatar4 = '/static/images/avatar-04.svg';

const avatars = [avatar1, avatar2, avatar3, avatar4];

export function pickAvatar(NameOrId) {
  let number = 0;
  if (isNaN(NameOrId)) {
    for (let i = 0; i < NameOrId.length; i++) {
      number += NameOrId.charCodeAt(i);
    }
  } else {
    number = NameOrId;
  }
  return avatars[number % 4];
}