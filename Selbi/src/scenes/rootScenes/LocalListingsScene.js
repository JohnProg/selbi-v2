import React from 'react';
import { connect } from 'react-redux';
import { ScrollView } from 'react-native';
import { loadListingByLocation } from '../../firebase/FirebaseConnector';
import RoutableScene from '../../nav/RoutableScene';
import ListingsListComponent from '../../components/ListingsListComponent';
import SellerInfoOverlay from '../../components/SellerInfoOverlay';

import { setLocalListings } from '../../reducers/LocalListingsReducer';
import { clearNewListing } from '../../reducers/NewListingReducer';

const initialSellerInfoHeight = 260;

class ListingsScene extends RoutableScene {
  constructor(props) {
    super(props);

    this.state = {
      sellerInfoOpacity: 1,
      sellerInfoHeight: initialSellerInfoHeight,
    };

    this.getGeolocation = this.getGeolocation.bind(this);
    this.fetchLocalListings = this.fetchLocalListings.bind(this);
  }

  getGeolocation() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log(error);
          // Code: 1 = permission denied, 2 = unavailable, 3 = timeout.
          reject(error.message);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );
    });
  }

  componentWillMount() {
    this.fetchLocalListings().catch(console.log);
  }

  fetchLocalListings() {
    console.log('fetching local listings')
    return this.getGeolocation()
      .then((latlon) => loadListingByLocation(latlon, 20))
      .then(this.props.setLocalListings);
  }

  onGoNext() {
    this.props.clearNewListingData();
  }

  renderWithNavBar() {
    return (
      <ScrollView>
        <SellerInfoOverlay />
        <ListingsListComponent
          listings={this.props.listings}
          emptyMessage={'Be the first to sell in your neighborhood!'}
          refresh={this.fetchLocalListings}
          openDetailScene={() => this.goNext('details')}
        />
      </ScrollView>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    listings: state.localListings,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setLocalListings: (localListings) => {
      dispatch(setLocalListings(localListings));
    },
    clearNewListingData: () => {
      dispatch(clearNewListing());
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ListingsScene);
