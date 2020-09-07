import React, {useEffect, useState} from 'react';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/eventManager';
import {eClearSearch, eScrollEvent} from '../../services/events';
import {inputRef} from '../../utils/refs';
import {db, DDS, selection, ToastEvent} from '../../utils/utils';
import Animated, {Easing} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {br, WEIGHT, SIZE} from '../../common/common';
import {TextInput, Text} from 'react-native';
const {Value, timing, block} = Animated;

let searchResult = [];
 
let offsetY = 0;
let timeoutAnimate = null;

export const Search = (props) => {
  const [state, dispatch] = useTracked();
  const {colors, searchResults} = state;
  const [text, setText] = useState('');
  const [focus, setFocus] = useState(false);

  let searchState = props.root ? state.searchState : state.indSearchState;

  const _marginAnim = new Value(0);
  const _opacity = new Value(1);
  const _borderAnim = new Value(1.5);

  const animation = (margin, opacity, border) => {
    timing(_marginAnim, {
      toValue: margin,
      duration: 230,
      easing: Easing.inOut(Easing.ease),
    }).start();
    timing(_opacity, {
      toValue: opacity,
      duration: 250,
      easing: Easing.inOut(Easing.ease),
    }).start();
    timing(_borderAnim, {
      toValue: border,
      duration: 270,
      easing: Easing.inOut(Easing.ease),
    }).start();
  };

  const onScroll = (y) => {
    if (searchResults.results.length > 0) return;
    if (y < 30) {
      animation(0, 1, 1.5);
      offsetY = y;
    }
    if (y > offsetY) {
      if (y - offsetY < 100) return;
      clearTimeout(timeoutAnimate);
      timeoutAnimate = null;
      timeoutAnimate = setTimeout(() => {
        animation(-65, 0, 0);
      }, 500);
      offsetY = y;
    } else {
      if (offsetY - y < 50) return;
      clearTimeout(timeoutAnimate);
      timeoutAnimate = null;
      timeoutAnimate = setTimeout(() => {
        animation(0, 1, 1.5);
      }, 500);
      offsetY = y;
    }
  };

  useEffect(() => {
    selection.data = searchState.data;
    selection.type = searchState.type;
    eSubscribeEvent(eScrollEvent, onScroll);
    eSubscribeEvent('showSearch', () => {
      animation(0, 1, 1.5);
    });

    return () => {
      eUnSubscribeEvent(eScrollEvent, onScroll);
      eUnSubscribeEvent('showSearch', () => {
        animation(0, 1, 1.5);
      });
    };
  }, [searchState]);

  const clearSearch = () => {
    if (searchResult && searchResult.length > 0) {
      searchResult = null;
      setText(null);

      inputRef.current?.setNativeProps({
        text: '',
      });
      dispatch({
        type: ACTIONS.SEARCH_RESULTS,
        results: {
          results: [],
          type: null,
          keyword: null,
        },
      });
    }
  };

  useEffect(() => {
    eSubscribeEvent(eClearSearch, clearSearch);
    return () => {
      eUnSubscribeEvent(eClearSearch, clearSearch);
    };
  }, []);

  const onChangeText = (value) => {
    setText(value);
  };
  const onSubmitEditing = async () => {
    if (!text || text.length < 1) {
      ToastEvent.show('Please enter a search keyword');
      clearSearch();
      return;
    }
    let type = searchState.type;
    if (!type) return;

    let data = searchState.data;

    searchResult = await db.lookup[type](
      data[0].data ? db.notes.all : data,
      text,
    );
    if (!searchResult || searchResult.length === 0) {
      ToastEvent.show('No search results found for ' + text, 'error');
      return;
    } else {
      dispatch({
        type: ACTIONS.SEARCH_RESULTS,
        results: {
          type,
          results: searchResult,
          keyword: text,
        },
      });
    }
  };

  const onBlur = () => {
    if (searchResult && searchResult.length === 0) {
      clearSearch();
    }
  };

  const onFocus = () => {
    //setSearch(false);
  };

  return searchState.data[0] && !searchState.noSearch ? (
    <Animated.View
      style={{
        opacity: _opacity,
        height: 60,
        justifyContent: 'center',
        marginTop: _marginAnim,
        paddingHorizontal: 12,
      }}>
      <Animated.View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingLeft: 12,
          width: '100%',
          alignSelf: 'center',
          borderRadius: br,
          height: '90%',
          borderWidth: _borderAnim,
          borderColor: focus
            ? searchState.color
              ? searchState.color
              : colors.accent
            : colors.nav,
        }}>
        <TextInput
          ref={inputRef}
          style={{
            fontFamily: WEIGHT.regular,
            color: colors.pri,
            maxWidth: '85%',
            width: '85%',
            fontSize: SIZE.sm,
          }}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => {
            setFocus(true);
            onFocus();
          }}
          onBlur={() => {
            setFocus(false);
            onBlur();
          }}
          numberOfLines={1}
          placeholder={searchState.placeholder}
          placeholderTextColor={colors.icon}
        />
        <Icon
          style={{paddingRight: DDS.isTab ? 12 : 12}}
          onPress={() => {
            onSubmitEditing();
          }}
          name="magnify"
          color={
            focus
              ? searchState.color
                ? searchState.color
                : colors.accent
              : colors.icon
          }
          size={SIZE.xxl}
        />
      </Animated.View>
    </Animated.View>
  ) : (
    <></>
  );
};
