import React from 'react';

import { View } from 'react-native';

import BulletinActionButton from './BulletinActionButton';
import EmojiAlignedText from '../components/EmojiAlignedText';
import VisibilityWrapper from '../components/VisibilityWrapper';

import bulletinStyles from './bulletinStyles';

export default function NewFollowerBulletin({ newFollowerBulletin, followUser, gotIt }) {
  console.log(newFollowerBulletin)
  const newFollowerDisplayName = newFollowerBulletin.payload.newFollowerPublicData.displayName;
  const newFollowerUsername = newFollowerBulletin.payload.newFollowerPublicData.username;

  return (
    <View>
      <EmojiAlignedText emoji=" 😘" style={bulletinStyles.bulletinText}>
       {newFollowerDisplayName} (@{newFollowerUsername}) is now following you.
      </EmojiAlignedText>
      <VisibilityWrapper isVisible={!newFollowerBulletin.payload.reciprocated}>
        <BulletinActionButton
          emoji=" 😘"
          text={`Follow ${newFollowerDisplayName}`}
          onPress={() => followUser(newFollowerBulletin.payload.newFollowerUid)}
          isAction={false}
        />
      </VisibilityWrapper>
      <VisibilityWrapper isVisible={newFollowerBulletin.payload.reciprocated}>
        <BulletinActionButton
          emoji=" 😘"
          text="Nice! Got it"
          onPress={gotIt}
          isAction={false}
        />
      </VisibilityWrapper>
    </View>
  );
}

NewFollowerBulletin.propTypes = {
  newFollowerBulletin: React.PropTypes.shape({
    status: React.PropTypes.oneOf(['read', 'unread']).isRequired,
    timestamp: React.PropTypes.number.isRequired,
    type: React.PropTypes.oneOf(['follow']).isRequired,
    payload: React.PropTypes.shape({
      newFollowerPublicData: React.PropTypes.object.isRequired,
      newFollowerUid: React.PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  followUser: React.PropTypes.func.isRequired,
  gotIt: React.PropTypes.func.isRequired,
};
