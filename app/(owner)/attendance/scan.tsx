import React, { useState } from 'react';
import { View, Text, StyleSheet, Button as RNButton, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../stores/auth.store';
import { useUIStore } from '../../../stores/ui.store';
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { ScreenHeader, Button } from '../../../components/ui';
import { Id } from '../../../convex/_generated/dataModel';

export default function QRScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const router = useRouter();
  const markAttendance = useMutation(api.attendance.mark);
  const { gymId } = useAuthStore();
  const { showToast } = useUIStore();

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Camera Permission" showBack onBack={() => router.back()} />
        <View style={styles.center}>
          <Text style={styles.text}>We need your permission to show the camera</Text>
          <RNButton onPress={requestPermission} title="Grant Permission" />
        </View>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { type: string, data: string }) => {
    setScanned(true);
    
    try {
      // Expecting data format: "fitforge-member:id"
      const prefix = "fitforge-member:";
      if (!data.startsWith(prefix)) {
        throw new Error('Invalid QR Code format.');
      }
      
      const memberId = data.slice(prefix.length) as Id<'users'>;
      
      await markAttendance({
        gymId: gymId as Id<'gyms'>,
        memberId,
        method: 'qr_scan',
      });

      showToast('success', 'Attendance logged successfully!');
      router.back();
    } catch (error: any) {
      Alert.alert('Scan Failed', error.message || 'Error recording attendance.', [
        { text: 'Try Again', onPress: () => setScanned(false) }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Scan Check-in QR" showBack onBack={() => router.back()} />
      <View style={styles.cameraContainer}>
        <CameraView 
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />
        
        <View style={styles.overlay}>
          <View style={styles.targetBox} />
        </View>
      </View>
      
      {scanned && (
        <View style={styles.footer}>
          <Button title="Tap to Scan Again" onPress={() => setScanned(false)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    ...Typography.bodyMd,
    color: Colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: Colors.accent,
    backgroundColor: 'transparent',
    borderRadius: 16,
  },
  footer: {
    padding: 24,
    backgroundColor: Colors.surface01,
  }
});
