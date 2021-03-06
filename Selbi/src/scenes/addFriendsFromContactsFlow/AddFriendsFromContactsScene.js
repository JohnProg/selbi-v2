import React from 'react';
import { connect } from 'react-redux';
import { ScrollView, View, Text } from 'react-native';

import { awaitPhoneVerification, followPhoneNumbers, updateBulletin }
  from '../../firebase/FirebaseConnector';
import { normalizePhoneNumber, loadAllContactsPhoneNumber } from './utils';

import RoutableScene from '../../nav/RoutableScene';
import SpinnerOverlay from '../../components/SpinnerOverlay';
import FlatButton from '../../components/buttons/FlatButton';
import NewFriendListItem from '../../components/NewFriendListItem';
import VisibilityWrapper from '../../components/VisibilityWrapper';

import styles from '../../../styles';


function VerifiedCodeComponent({ followContacts }) {
  return (
    <View style={styles.paddedContainer}>
      <Text style={styles.friendlyTextLeft}>
        Successfully verified your phone!
      </Text>
      <View style={styles.halfPadded} />
      <Text style={styles.friendlyTextLeft}>
        Follow people in your contact book to see what your friends are selling.
      </Text>
      <View style={styles.halfPadded} />
      <FlatButton onPress={followContacts}>
        <Text>Follow Contacts</Text>
      </FlatButton>
    </View>
  );
};


function AddedFriendsComponent({ usersFollowed }) {
  console.log('Added friends: ', usersFollowed);
  const numFriends = usersFollowed.length;
  let friendsString = 'friends';
  if (numFriends === 1) {
    friendsString = 'friend';
  }
  return (
    <ScrollView>
      <View style={styles.paddedContainer}>
        <Text style={styles.friendlyTextLeft}>
          Added {numFriends} {friendsString} from your phone book.
        </Text>
        <View style={styles.halfPadded} />
        <Text style={styles.friendlyTextLeft}>
          Your contacts will also be able to follow you based on your phone number.
        </Text>
        <View style={styles.halfPadded} />
        <VisibilityWrapper isVisible={Object.keys(usersFollowed).length > 0}>
          <Text style={{ fontWeight: 'bold' }}>
            You are now following:
          </Text>
        </VisibilityWrapper>
        {usersFollowed.map((userData) =>
          <NewFriendListItem key={userData.uid} friendData={userData} />)}
      </View>
    </ScrollView>
  );
}

function FailureComponent() {
  return (
    <View sylte={styles.paddedCenterContainer}>
      <Text style={styles.friendlyText}>
        There has been an error adding your contacts. Please try again later. 😭
      </Text>
    </View>
  );
}

class AddFriendsFromContactsScene extends RoutableScene {
  constructor(props) {
    super(props);
    this.addFriendsFromPhoneBook = this.addFriendsFromPhoneBook.bind(this);

    this.state = {
      view: <SpinnerOverlay isVisible message="Waiting for code verification..." />,
    };
  }

  addFriendsFromPhoneBook() {
    const success = (usersFollowed) => {
      this.setState({
        view: <AddedFriendsComponent usersFollowed={usersFollowed} />,
      });

      Object.keys(this.props.bulletins).forEach((key) => {
        if (this.props.bulletins[key].type === 'should-add-phone') {
          updateBulletin(key, { status: 'read' });
        }
      });
    };

    const error = (error) => this.setState({
      view: <FailureComponent />,
    });

    this.setState({
      view: <SpinnerOverlay message="Adding friends from contacts..." />,
    }, () => {
      loadAllContactsPhoneNumber()
        .then(followPhoneNumbers)
        .then(success)
        .catch(error);
    });
  }

  componentDidMount() {
    awaitPhoneVerification(normalizePhoneNumber(this.props.phoneNumber))
      .then(() => {
        this.setState({
          view: <VerifiedCodeComponent followContacts={this.addFriendsFromPhoneBook} />,
        });
      })
      .catch((error) => {
        this.setState({
          view: <FailureComponent message={`Failed to verified your phone. ${error}`} />,
        });
      });
  }

  renderWithNavBar() {
    return (
      <View style={styles.container}>
        {this.state.view}
      </View>
    );
  }
}

function mapStateToProps(state) {
  return {
    phoneNumber: state.addPhone.number,
    bulletins: state.bulletins,
  };
}

export default connect(
  mapStateToProps,
  undefined
)(AddFriendsFromContactsScene);
