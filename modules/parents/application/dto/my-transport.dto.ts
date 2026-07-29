export interface MyTransportDTO {
  routeName: string;
  stopName: string;
  pickupTime: string | null;
  dropTime: string | null;
  tripType: string;
  status: string;
  vehicleRegistrationNumber: string | null;
  driverName: string | null;
  driverPhone: string | null;
  helperName: string | null;
  todayPickupStatus: string | null;
  todayDropStatus: string | null;
}
