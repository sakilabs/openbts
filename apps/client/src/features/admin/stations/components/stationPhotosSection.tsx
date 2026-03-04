import { PhotosSection } from "@/components/photosSection";
import { fetchStationPhotos, setMainPhoto, deleteStationPhoto, uploadStationPhotos, updatePhotoNote } from "@/features/station-details/api";

type Props = { stationId: number };

export function StationPhotosSection({ stationId }: Props) {
  return (
    <PhotosSection
      queryKey={["station-photos", stationId]}
      fetchFn={() => fetchStationPhotos(stationId)}
      deleteFn={(id) => deleteStationPhoto(stationId, id)}
      updateNoteFn={(id, note) => updatePhotoNote(stationId, id, note)}
      setMainFn={(id) => setMainPhoto(stationId, id)}
      uploadFn={(files) => uploadStationPhotos(stationId, files)}
    />
  );
}
