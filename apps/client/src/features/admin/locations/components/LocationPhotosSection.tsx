import { PhotosSection } from "@/components/photosSection";
import { fetchLocationPhotos, uploadLocationPhotos, updateLocationPhotoNote, deleteLocationPhoto } from "@/features/station-details/api";

type Props = { locationId: number };

export function LocationPhotosSection({ locationId }: Props) {
  return (
    <PhotosSection
      queryKey={["location-photos", locationId]}
      fetchFn={() => fetchLocationPhotos(locationId)}
      deleteFn={(id) => deleteLocationPhoto(locationId, id)}
      updateNoteFn={(id, note) => updateLocationPhotoNote(locationId, id, note)}
      uploadFn={(files) => uploadLocationPhotos(locationId, files)}
    />
  );
}
