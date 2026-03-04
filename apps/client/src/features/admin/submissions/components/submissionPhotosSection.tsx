import { PhotosSection } from "@/components/photosSection";
import { fetchSubmissionPhotos, deleteSubmissionPhoto, updateSubmissionPhotoNote } from "@/features/submissions/api";

type Props = { submissionId: string };

export function SubmissionPhotosSection({ submissionId }: Props) {
  return (
    <PhotosSection
      queryKey={["submission-photos", submissionId]}
      fetchFn={() => fetchSubmissionPhotos(submissionId)}
      deleteFn={(id) => deleteSubmissionPhoto(submissionId, id)}
      updateNoteFn={(id, note) => updateSubmissionPhotoNote(submissionId, id, note)}
      hideWhenEmpty
    />
  );
}
