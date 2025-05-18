import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { Colors } from '@/constants/Colors';
import { horizontalScale, moderateScale, verticalScale } from '@/constants/Metrics';

const { width } = Dimensions.get('window');

interface ProgressBarProps {
  completedCount: number;
  totalCount: number;
}

export default function ProgressBar({ completedCount, totalCount }: ProgressBarProps) {
  // Calculate progress percentage (prevent division by zero)
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  
  return (
    <View style={styles.container}>
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${progressPercentage}%` }
          ]} 
        />
      </View>
      <Text style={styles.progressText}>
        {completedCount}/{totalCount} Tamamlandı
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: horizontalScale(20),
    marginBottom: verticalScale(16),
    marginTop: verticalScale(5),
  },
  progressBarContainer: {
    width: '100%',
    height: verticalScale(10),
    backgroundColor: '#333333',
    borderRadius: moderateScale(5),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.green,
    borderRadius: moderateScale(5),
  },
  progressText: {
    marginTop: verticalScale(5),
    fontSize: moderateScale(12),
    color: Colors.white,
    fontFamily: 'SFProMedium',
    textAlign: 'center',
  }
});
