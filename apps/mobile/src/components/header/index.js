import React, {useEffect, useState} from 'react';
import {View, TouchableOpacity, Platform, Text} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {SIZE, WEIGHT} from '../../common/common';
import {h} from '../../utils/utils';
import * as Animatable from 'react-native-animatable';

export const Header = ({
  heading,
  colors,
  canGoBack = true,
  hide,
  showSearch,
  sendHeight = e => {},
}) => {
  return (
    <Animatable.View
      onLayout={e => {
        if (sendHeight) {
          sendHeight(e.nativeEvent.layout.height);
        }
      }}
      transition="height"
      duration={300}
      style={{
        height: hide ? 50 : 50,
        flexDirection: 'row',
        zIndex: 10,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Platform.isPad ? '2.5%' : '5%',
        paddingTop: Platform.OS == 'ios' ? h * 0.02 : h * 0.06,
        marginBottom: h * 0.06,
      }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
        }}>
        {canGoBack ? (
          <TouchableOpacity
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              paddingRight: 15,
            }}>
            <Icon name={'chevron-left'} size={SIZE.xl} />
          </TouchableOpacity>
        ) : (
          undefined
        )}

        <Animatable.Text
          transition="fontSize"
          duration={300}
          style={{
            fontSize: hide ? SIZE.xl : SIZE.xxl,
            color: colors.pri,
            fontFamily: WEIGHT.bold,
          }}>
          {heading}
        </Animatable.Text>
      </View>
      <Animatable.View
        transition="opacity"
        duration={500}
        style={{
          opacity: hide ? 1 : 0,
        }}>
        <TouchableOpacity
          onPress={() => showSearch()}
          style={{
            justifyContent: 'center',
            alignItems: 'flex-end',
            height: 40,
            width: 60,
            paddingRight: 0,
            marginTop: 7,
          }}>
          <Icon name={'search'} size={SIZE.xl} />
        </TouchableOpacity>
      </Animatable.View>
    </Animatable.View>
  );
};
