import { PhotosSection } from "@/components/photosSection";
import { deleteSubmissionPhoto, fetchSubmissionPhotos, updateSubmissionPhotoNote, updateSubmissionPhotoTakenAt } from "@/features/submissions/api";

type Props = { submissionId: string; readOnly?: boolean };

export function SubmissionPhotosSection({ submissionId, readOnly }: Props) {
  return (
    <PhotosSection
      queryKey={["submission-photos", submissionId]}
      fetchFn={() => fetchSubmissionPhotos(submissionId)}
      deleteFn={(id) => deleteSubmissionPhoto(submissionId, id)}
      updateNoteFn={(id, note) => updateSubmissionPhotoNote(submissionId, id, note)}
      updateTakenAtFn={(id, takenAt) => updateSubmissionPhotoTakenAt(submissionId, id, takenAt)}
      hideWhenEmpty
      readOnly={readOnly}
    />
  );
}
